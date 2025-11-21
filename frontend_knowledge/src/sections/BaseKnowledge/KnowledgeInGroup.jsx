//компонент отображения содержания знаний в группе
import { useParams, NavLink, useLoaderData, Outlet } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo, useRef, useReducer } from 'react'
import { API } from "../../apiAxios/apiAxios"
import { KnowledgeCreateModal } from './KnowledgeCreateModal'
// import { KnowledgeTabs } from './KnowledgeTabs';
// import KnowledgeOpenContent from './KnowledgeOpenContent';
// import Pagination from './Pagination/Pagination';
import './Pagination/PaginationList.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { EditTabListModal } from './EditTabListModal'
import { SaveTabListModal } from './SaveTabListModal'
import './CSS/Search.css';
import './CSS/SaveTabs.css';
// import { ArrowIcon } from './SvgArrow'

// import { SearchBar } from './SearchBar'
import { KnowledgeListPanel } from './KnowledgeListPanel';
import { KnowledgeTabsPanel } from './KnowledgeTabsPanel';
import { ErrorDisplay } from './ErrorDisplay'


function KnowledgeInGroup() {	

	const {slug_gr} = useParams();			
 
  // Состояния для левой панели
  const [knowledges, setKnowledges] = useState([]);
  const [loading, setLoading] = useState(false);  
	const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);//ключ для перезагрузки эффекта загрузки знаний
  const [reloadKeyTab, setReloadKeyTab] = useState(0);//ключ для перезагрузки эффекта загрузки табов

  // СОСТОЯНИЯ ДЛЯ ПОИСКА  
  const [searchState, setSearchState] = useState({
    searchTerm: '',
    activeSearchTerm: '', // Текущий активный поисковый запрос
    searchType: 'plain', // plain, phrase, advanced
    isSearchActive: false // Флаг активного поиска
  });
  
  // состояния для пагинации знаний
  const [paginationState, setPaginationState] = useState({
    currentPage: 1,//номер текущей страницы
    perPage: 2,//максимально элементов на одной странице
    total: 0,//всего элементов в загрузке
    totalPages: 0,//всего страниц в соответствии с количеством элементов
    hasNext: false,//есть ли следующий
    hasPrev: false //есть ли предыдущий
  });

  // состояние для фильтра по дате изменения
  const [filter_change_date, setFilter_change_date] = useState(false)

  // Состояние для активных вкладок
  const [activeTabs, setActiveTabs] = useState([]);  
    
  // Состояния модальных окон
  const [modalCreateKnowledge, setModalCreateKnowledge] = useState(false);
  const [showSaveTabListModal, setShowSaveTabListModal] = useState(false);
  const [showEditTabListModal, setShowEditTabListModal] = useState(false);  
  const [editingTabList, setEditingTabList] = useState(null);
    
  const TAB_LISTS_PER_PAGE = 2; // Количество списков на страницу. Решил оставить

  // переделал в объект, тут и списки вкладок и скролл с кнопкой
  const [tabListsState, setTabListsState] = useState({
    savedTabLists: [],
    activeTabList: null, // Текущий открытый список
    viewTabList: false, //видимость списков вкладок
    tabsName: [],//названия знаний в сохраненном списке знаний    
    tabListsPage: 1,
    tabListsTotal: 0,
    loadingTabLists: false, // Индикатор загрузки первой страницы
    hasMoreTabLists: true, // Есть ли еще страницы для загрузки
    isLoadingMoreTabLists: false, // Индикатор загрузки дополнительных страниц
  });  
  
  // Состояние для сворачивания левой панели
  const [openListKnowledges, setOpenListKnowledges] = useState(true);

  // юзреф для состояния пагинации для актуальных данных. Подойдет если будет все плохо с производительностью. 
  const paginationRef = useRef(paginationState);
  paginationRef.current = paginationState; // всегда актуальное значение


  // отдельная функция для основной загрузки знаний в эффекте
  const loadKnowledges = async (abortController = null) => {
           
    const controller = abortController || new AbortController();    
    
    try {
      setLoading(true);
      setError('');
      // ФОРМИРУЕМ ПАРАМЕТРЫ ЗАПРОСА
      const params = {
        page: paginationState.currentPage,
        per_page: paginationState.perPage,
      };

      // ДОБАВЛЯЕМ ПАРАМЕТРЫ ПОИСКА ЕСЛИ АКТИВЕН
      if (searchState.isSearchActive && searchState.activeSearchTerm) {
        params.search = searchState.activeSearchTerm;
        params.search_type = searchState.searchType;
        params.use_fts = true;
      }       

      if (filter_change_date) {
        params.filter_change_date = filter_change_date;
      }

      const response = await API.get(
        `/knowledges_in_group/${slug_gr}`,
        { 
          params,
          signal: controller.signal 
        }
      );
                  
      const data = response.data;
      
      setKnowledges(data.items);
      setPaginationState(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.total_pages,
        hasNext: data.has_next,
        hasPrev: data.has_prev
      }));
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Запрос прерван');
        return;
      }
      console.error('Error loading knowledge list:', err);
      setError(`Ошибка при загрузке знаний: ${err.message}`);      
    } finally {
      setLoading(false);
    }
  }
  
  // ОБРАБОТЧИКИ ПОИСКА
  const handleSearchChange = useCallback((e) => {
    setSearchState(prev => ({ ...prev, searchTerm: e.target.value }));
  }, []);

  // ПОИСК ПО КНОПКЕ "НАЙТИ". Добавляем в состояние поиска значения и делаем поиск активным и срабатывает useEffect с основной загрузкой. 
  const handleSearchSubmit = useCallback(() => {
    const { searchTerm } = searchState;
    if (searchTerm.trim()) {
      setSearchState(prev => ({ 
        ...prev, 
        activeSearchTerm: searchTerm.trim(),
        isSearchActive: true
      }));
      setPaginationState(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchState.searchTerm]);

  // ОЧИСТКА ПОИСКА
  const clearSearch = useCallback(() => {
    setSearchState({
      searchTerm: '',
      activeSearchTerm: '',
      searchType: 'plain',
      isSearchActive: false
    });
    setPaginationState(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // ПОИСК ПО КЛАВИШЕ ENTER
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);


  // выбор типа поиска
  const handleSearchTypeChange = useCallback((e) => {
    setSearchState(prev => ({ ...prev, searchType: e.target.value }));
    // Если поиск активен - перезапускаем его с новым типом
    if (searchState.isSearchActive && searchState.activeSearchTerm) {
      setPaginationState(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [searchState.isSearchActive, searchState.activeSearchTerm]);
  
  // конец обработчиков поиска


  // Обработчики для пагинации списка знаний
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= paginationState.totalPages) {
      setPaginationState(prev => ({ ...prev, currentPage: newPage }));
    }
  }, [paginationState.totalPages]);
  
  // Обработчик изменения количества элементов на странице   
  const handlePerPageChange = useCallback((e) => {
    const newPerPage = parseInt(e.target.value);
    setPaginationState(prev => ({ 
      ...prev, 
      perPage: newPerPage, 
      currentPage: 1 // Сбрасываем на первую страницу при изменении размера
    }));
  }, []);
  
  // конец пагинации списка знаний

  // Обработчики для знаний и вкладок!!!!!
  // Загружает полные данные только при необходимости
  const openKnowledgeInTab = useCallback(async (knowledge) => {
    if (activeTabs.some(tab => tab.id === knowledge.id)) {
      switchTab(knowledge.id);
      return;
    }

    try {
      setLoading(true);
      const response = await API.get(`/knowledges_open/${knowledge.id}`);
      const fullKnowledge = response.data;

      setActiveTabs((prev) => {
        const newTabs = prev.map((tab) => ({ ...tab, active: false }));
        const existingTabIndex = newTabs.findIndex((tab) => tab.id === knowledge.id);
        
        if (existingTabIndex !== -1) {
          newTabs[existingTabIndex].active = true;
          return newTabs;
        }

        return [
          ...newTabs,
          {
            id: knowledge.id,
            title: knowledge.title,
            knowledge: fullKnowledge,
            active: true
          }
        ];
      });
    } catch (err) {
      console.error('Error whith open knowledge:', err);
      setError(`Не удалось открыть знание: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeTabs]);


  //функция для переключения между вкладками     
  const switchTab = useCallback((tabId) => {
    setActiveTabs(prev => 
      prev.map((tab) => ({
        ...tab,
        active: tab.id === tabId // Активируем только выбранную вкладку
      }))
    );
  }, []);

  // функция для закрытия вкладки  
  const closeTab = useCallback((tabId) => {
    setActiveTabs((prev) => {
      // Фильтруем вкладки, убирая закрываемую
      const filtered = prev.filter((tab) => tab.id !== tabId);      
      if (filtered.length === 0) return filtered;      
      // Проверяем, была ли закрываемая вкладка активной
      const wasActive = prev.find((tab) => tab.id === tabId)?.active;      
      if (wasActive) {
        // Активируем последнюю вкладку
        const lastTabIndex = filtered.length - 1;
        return filtered.map((tab, index) => ({
          ...tab,
          active: index === lastTabIndex
        }));
      }      
      return filtered;
    });
  }, []);

 
  // функция используется когда знание редактируется
  const updateTabKnowledge = useCallback((tabId, updatedKnowledge) => {    
    // если группа слева (slug_gr) не равна выбранной группе при редактировании шапки, то удаляем знание
    if (slug_gr !== updatedKnowledge.group.slug) {
      setKnowledges(prev => prev.filter(kn => kn.id !== tabId));
      setPaginationState(prev => ({ ...prev, total: prev.total - 1 }));
    }
    // если группа слева (slug_gr) равна выбранной группе при редактировании шапки и знания нет в текущем списке, то добавляем знание
    if (slug_gr === updatedKnowledge.group.slug) {
      // делаем сет из id списка загруженных знаний    
      const knowledgeIdsSet = new Set(knowledges.map(item => item.id));
      //если знания нет в списке, то добавляем его
      if (!knowledgeIdsSet.has(tabId)) {
        setKnowledges(prevKnowledge =>         
        [
          {id: updatedKnowledge.id, title: updatedKnowledge.title, description: updatedKnowledge.description}, ...prevKnowledge
        ]
        );
        setPaginationState(prev => ({ ...prev, total: prev.total + 1 }));  
      }

    //это для изменения названия в списке знаний
    if (knowledgeIdsSet.has(tabId)) {
        setKnowledges(prevKnowledges =>
              prevKnowledges.map(item =>
                item.id === tabId
                  ? { ...item, title: updatedKnowledge.title, description: updatedKnowledge.description } 
                  : item
              )
          );}
          }

    // обновление состояния вкладок знаний
    setActiveTabs(prev => 
      prev.map(tab => 
        tab.id === tabId 
          ? { 
              ...tab, 
              knowledge: updatedKnowledge, 
              title: updatedKnowledge.title
            }
          : tab
      )
    );
  }, [slug_gr, knowledges]);
     
  const lenKN = useRef(knowledges);
  lenKN.current = knowledges.length; // длинна массива знаний по факту
  
  const deleteKnowledge = useCallback(async () => {
    if (lenKN.current === 1 && paginationRef.current.currentPage !== 1) {      
      setPaginationState(prev => ({ ...prev, currentPage: paginationRef.current.currentPage - 1 }));
      return
    }    
    setReloadKey(prev => prev + 1);// это для срабатывания useEffect для загрузки знаний  
  }, []);
  

  const handleCreateKnowledge = useCallback((group_slug) => {    
    if (slug_gr === "all" || slug_gr === group_slug) {      
      setReloadKey(prev => prev + 1);      
    }    
    setModalCreateKnowledge(false);      
    }, [slug_gr]);

     

  // Обработчики для списков вкладок!!!!!!!!!!!!
  // ЗАГРУЗКА СПИСКОВ ВКЛАДОК С ПАГИНАЦИЕЙ
  const loadSavedTabLists = useCallback(async (page = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setTabListsState(prev => ({ ...prev, isLoadingMoreTabLists: true }));
    } else {
      setTabListsState(prev => ({ ...prev, loadingTabLists: true }));
    }
    
    try {
      const response = await API.get('/get_tab_lists/', {
        params: {
          page: page,
          per_page: TAB_LISTS_PER_PAGE
        }
      });

      const data = response.data;
      const savedTabArray = Array.isArray(data.items) ? data.items : [];
          
      // ДОБАВЛЯЕМ ПОЛЕ viewListTab ДЛЯ КАЖДОГО СПИСКА для отображения содержимого
      const tabListsWithViewState = savedTabArray.map(item => ({
        ...item,
        viewListTab: false // По умолчанию свернуто
      }));
      
      if (isLoadMore) {
        // Добавляем к существующим данным        
        setTabListsState(prev => ({
          ...prev,
          savedTabLists: [...prev.savedTabLists, ...tabListsWithViewState],
          tabListsPage: page,          
          hasMoreTabLists: data.has_next
        }));
      } else {
        // Первая загрузка
        setTabListsState(prev => ({
          ...prev,
          savedTabLists: tabListsWithViewState,
          tabListsPage: page,          
          hasMoreTabLists: data.has_next,
          tabListsTotal: data.total
        }));
      }      

    } catch (err) {
      console.error('Error whith load saved tab list:', err);
      setError(`Ошибка загрузки списков вкладок: ${err.message}`)
    } finally {
      if (isLoadMore) {
        setTabListsState(prev => ({ ...prev, isLoadingMoreTabLists: false }));
      } else {
        setTabListsState(prev => ({ ...prev, loadingTabLists: false }));
      }
    }
  }, []);
  
  // ЗАГРУЗКА СЛЕДУЮЩЕЙ СТРАНИЦЫ СПИСКОВ ВКЛАДОК
  const loadMoreTabLists = useCallback(async () => {
      const { isLoadingMoreTabLists, hasMoreTabLists, tabListsPage } = tabListsState;      
      if (isLoadingMoreTabLists || !hasMoreTabLists) {      
        return;
      } 
      const nextPage = tabListsPage + 1;
      await loadSavedTabLists(nextPage, true);
  }, [
    tabListsState.isLoadingMoreTabLists, 
    tabListsState.hasMoreTabLists, 
    tabListsState.tabListsPage,    
    loadSavedTabLists
  ]);

  // СОХРАНЕНИЕ ТЕКУЩИХ ВКЛАДОК КАК СПИСКА
  const saveCurrentTabsAsList = useCallback(async (name, description) => {
    try {
      // Формируем список ID активных знаний
      const knowledgeIds = activeTabs.map(tab => tab.id);
      
      const tabListData = {
        name,
        description,
        active_tabs: knowledgeIds
      };

      const response = await API.post('/create_tab_list/', tabListData);
      
      // Обновляем локальное состояние
      setTabListsState(prev => ({
        ...prev,
        savedTabLists: [response.data, ...prev.savedTabLists],
        tabListsTotal: prev.tabListsTotal + 1
      }));
      setShowSaveTabListModal(false);
      setReloadKeyTab(prev => prev + 1);
      
      // Показываем уведомление об успехе
      // console.log('Список вкладок успешно сохранен!');
      
    } catch (err) {
      console.error('Error save tab list:', err);
      setError(`Ошибка сохранения списка вкладок: ${err.message}`)
    }
  }, [activeTabs]);


  // ОТКРЫТИЕ СОХРАНЕННОГО СПИСКА ВКЛАДОК
  const openSavedTabList = useCallback(async (tabListId) => {
    try {
      setLoading(true);      
      // Получаем данные знаний из списка
      const response = await API.post(`/open_tab_list/${tabListId}/open`);
      const knowledgeList = response.data;
      
      if (knowledgeList.length === 0) {
        console.log('Список вкладок пуст');
        return;
      }
      // список названий в открытой вкладке
      setTabListsState(prev => ({
        ...prev,
        tabsName: knowledgeList.map(item => item.title)
      }));
      // Закрываем все текущие вкладки
      setActiveTabs([]);
      
      // Последовательно открываем каждое знание из списка      
      const newTabs = [];
      for (const knowledge of knowledgeList) {        
          newTabs.push({
            id: knowledge.id,
            title: knowledge.title,
            knowledge: knowledge,
            active: false // Пока неактивны, активируем последнюю позже
          });        
      }      
      // Активируем последнюю вкладку
      if (newTabs.length > 0) {
        newTabs[newTabs.length - 1].active = true;
      }      
      setActiveTabs(newTabs);      
      setTabListsState(prev => ({ ...prev, activeTabList: tabListId }));// Запоминаем какой список открыт      
    } catch (err) {
      console.error('Error whith open tab list:', err);
      setError(`Ошибка открытия списка вкладок: ${err.message}`)
    } finally {
      setLoading(false);
    }
  }, []);
  
  
  // УДАЛЕНИЕ СПИСКА ВКЛАДОК
  const deleteSavedTabList = useCallback(async (tabListId, event) => {
    event.stopPropagation(); // Предотвращаем открытие списка при удалении
    
    if (!window.confirm('Вы уверены, что хотите удалить этот список вкладок?')) {
      return;
    }
    
    try {
      await API.delete(`/delete_tab_list/${tabListId}`);      
      
      // Обновляем локальное состояние      
      setTabListsState(prev => (       
        {
        ...prev,
        savedTabLists: prev.savedTabLists.filter(list => list.id !== tabListId),
        tabListsTotal: prev.tabListsTotal - 1,        
        }
      ));
            
      // Если удаляемый список был активным - сбрасываем активный список
      if (tabListsState.activeTabList === tabListId) {        
        setTabListsState(prev => ({ ...prev, activeTabList: null }));
      }
      setReloadKeyTab(prev => prev + 1);
      
    } catch (err) {
      console.error('Error deleting tab list:', err);
      setError(`Ошибка при удалении набора знаний: ${err.message}`)
    }
  }, [tabListsState.activeTabList]);

  
  // РЕДАКТИРОВАНИЕ СПИСКА ВКЛАДОК
  const startEditingTabList = useCallback((tabList, event) => {
    event.stopPropagation();
    setEditingTabList(tabList);
    setShowEditTabListModal(true);
  }, []);


  const updateTabList = useCallback(async (name, description) => {
    try {
      const updateData = {
        id: editingTabList.id,
        name,
        description
      };
      const response = await API.patch('/change_tab_list/', updateData);      
      // Обновляем локальное состояние
      setTabListsState(prev => ({
        ...prev,
        savedTabLists: prev.savedTabLists.map(list => 
          list.id === editingTabList.id ? response.data : list
        )
      }));
      setShowEditTabListModal(false);
      setEditingTabList(null);      
    } catch (err) {
      console.error('Error updating tab list:', err);
      setError(`Ошибка при редактировании набора вкладок: ${err.message}`)
    }
  }, [editingTabList]);


  const showTabsName = useCallback((tabId, event) => {
    if (event) {
      event.stopPropagation(); // Предотвращаем открытие списка при клике на кнопку
    }
    setTabListsState(prev => ({
      ...prev,
      savedTabLists: prev.savedTabLists.map(item => 
        item.id === tabId
          ? { ...item, viewListTab: !item.viewListTab }
          : item
      )
    }));
  }, []);

  // это для кнопки свернуть развернуть для списка вкладок. Отдкльная функция с колбеком
  const toggleViewTabList = useCallback(() => {
    setTabListsState(prev => ({ ...prev, viewTabList: !prev.viewTabList }));
  }, []);

  

  //это для переключения сортировки по дате
  const toggleDateFilter = useCallback(() => {    
    setFilter_change_date(prev => !prev);    
  }, []);


  // открыть модалку создания знания
  const openModalCreateKnowledge = useCallback(() => {
    setModalCreateKnowledge(true);
  }, []);

  // Эффекты начало!!!!!!!!!!!!!!!

  //эффект для пагинации 
  useEffect(() => {    
    // Сбрасываем поиск при смене группы
    clearSearch();
  }, [slug_gr]); // Срабатывает только при изменении slug_gr

 
  // ОСНОВНОЙ ЭФФЕКТ ДЛЯ ЗАГРУЗКИ ДАННЫХ
  useEffect(() => {
    const abortController = new AbortController();  
    
    loadKnowledges(abortController);      

    console.log("Сработал эффект загрузки")

    return () => {       
      abortController.abort();
    }
  }, [
    reloadKey,    
    paginationState.currentPage, 
    paginationState.perPage, 
    slug_gr, 
    searchState.activeSearchTerm, 
    searchState.searchType, 
    searchState.isSearchActive, 
    filter_change_date,    
  ]);


  useEffect(() => {
    loadSavedTabLists(1, false);    
  }, [loadSavedTabLists]);

  useEffect(() => {
    loadSavedTabLists(tabListsState.page, false);
  }, [reloadKeyTab]);


  // ОБНОВЛЕНИЕ АКТИВНОГО СПИСКА (при изменении вкладок)
  useEffect(() => {
    // Если активный список установлен, но вкладки изменились - сбрасываем активный список
    if (tabListsState.activeTabList && activeTabs.length === 0) {      
      setTabListsState(prev => ({ ...prev, activeTabList: null }));
    }
  }, [activeTabs, tabListsState.activeTabList]);

    
  if (knowledges?.error) {
    return (<h1>Ошибка: {knowledges?.error}. Пройдите авторизацию.</h1>)
  }

  const openSaveTabs = useCallback(async () => {
    setShowSaveTabListModal(true)
  }, [])


  
  
	return (
		<div className='container-knowledges-view'>

      {/* Компонент для отображения ошибок */}
      <ErrorDisplay 
          error={error} 
          onClose={() => setError(null)} 
        />  

      <br/><br/>            
      <div className="collapse-toggle">
        <button className="hidden-button" onClick={() => {setOpenListKnowledges(!openListKnowledges);}}>
              {openListKnowledges ? <FaChevronLeft /> : <FaChevronRight /> }
        </button>
        <br/><br/>
      </div>      

      <KnowledgeListPanel
        // Состояния        
        knowledges={knowledges}        
        loading={loading}
        error={error}

        openListKnowledges={openListKnowledges}
        searchState={searchState}
        paginationState={paginationState}
        tabListsState={tabListsState}
        filter_change_date={filter_change_date}
        activeTabsCount={activeTabs.length}        
        
        // Обработчики
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={clearSearch}
        onKeyPress={handleKeyPress}
        onSearchTypeChange={handleSearchTypeChange}
        onPerPageChange={handlePerPageChange}
        onPageChange={handlePageChange}
        onToggleDateFilter={toggleDateFilter}
        onToggleViewTabList={toggleViewTabList}
        onOpenKnowledge={openKnowledgeInTab}
        onSaveTabs={openSaveTabs}
        onShowTabsName={showTabsName}
        onStartEditingTabList={startEditingTabList}
        onDeleteSavedTabList={deleteSavedTabList}
        onOpenSavedTabList={openSavedTabList}
        onLoadMoreTabLists={loadMoreTabLists}
        onOpenModalCreateKnowledge={openModalCreateKnowledge}
      />
      
      <KnowledgeTabsPanel
        error={error}
        tabs={activeTabs}
        activeTab={activeTabs.find(tab => tab.active)}
        onCloseTab={closeTab}
        onSwitchTab={switchTab}
        onUpdate={updateTabKnowledge}
        onDelete={deleteKnowledge}        
      />
      

      {modalCreateKnowledge && (
        <KnowledgeCreateModal
          onClose={() => setModalCreateKnowledge(false)}
          onSuccess={handleCreateKnowledge}
        />
      )}

      {/* МОДАЛКА СОХРАНЕНИЯ ВКЛАДОК */}
        {showSaveTabListModal && (
          <SaveTabListModal
            onClose={() => setShowSaveTabListModal(false)}
            onSave={saveCurrentTabsAsList}
            tabCount={activeTabs.length}
            loading={loading}
            error={error}
          />
        )}

        {/* МОДАЛКА РЕДАКТИРОВАНИЯ ВКЛАДОК */}
        {showEditTabListModal && editingTabList && (
          <EditTabListModal
            tabList={editingTabList}
            onClose={() => {
              setShowEditTabListModal(false);
              setEditingTabList(null);
            }}
            onSave={updateTabList}
            loading={loading}
            error={error}
          />
        )}


    </div>
		)
}



export { KnowledgeInGroup }


