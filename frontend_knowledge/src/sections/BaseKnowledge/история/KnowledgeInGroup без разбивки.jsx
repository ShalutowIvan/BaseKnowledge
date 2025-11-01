//компонент отображения содержания знаний в группе
import { useParams, NavLink, useLoaderData, Outlet } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { API } from "../../apiAxios/apiAxios"
import { KnowledgeCreateModal } from './KnowledgeCreateModal'
import { KnowledgeTabs } from './KnowledgeTabs';
import { KnowledgeOpenContent } from './KnowledgeOpenContent';
import Pagination from './Pagination/Pagination';
import './Pagination/PaginationList.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { EditTabListModal } from './EditTabListModal'
import { SaveTabListModal } from './SaveTabListModal'
import './CSS/Search.css';
import './CSS/SaveTabs.css';
import { ArrowIcon } from './SvgArrow'
import { LoadMoreTabListsButton } from './LoadMoreTabListsButton'
import { SearchBar } from './SearchBar'


function KnowledgeInGroup() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {slug_gr} = useParams();
		
	const [modalCreateKnowledge, setModalCreateKnowledge] = useState(false);

  //состояние открыт ли список знаний
  const [openListKnowledges, setOpenListKnowledges] = useState(true);

  const [knowledges, setKnowledges] = useState([]);
  // состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);//номер текущей страницы
  const [perPage, setPerPage] = useState(10);//максимально элементов на одной странице
  const [total, setTotal] = useState(0);//всего элементов в загрузке
  const [totalPages, setTotalPages] = useState(0);//всего страниц в соответствии с количеством элементов
  const [hasNext, setHasNext] = useState(false);//есть ли следующий
  const [hasPrev, setHasPrev] = useState(false);//есть ли предыдущий

  // фильтры по дате изменения
  const [filter_change_date, setFilter_change_date] = useState(false)

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Состояние для активных вкладок
  const [activeTabs, setActiveTabs] = useState([]);

  // СОСТОЯНИЯ ДЛЯ ПОИСКА
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // Текущий активный поисковый запрос
  const [searchType, setSearchType] = useState('plain'); // plain, phrase, advanced
  const [isSearchActive, setIsSearchActive] = useState(false); // Флаг активного поиска

  // понять зачем второе состояние activeSearchTerm для поиска

  // НОВЫЕ СОСТОЯНИЯ ДЛЯ РАБОТЫ СО СПИСКАМИ ВКЛАДОК
  const [savedTabLists, setSavedTabLists] = useState([]);
  const [showSaveTabListModal, setShowSaveTabListModal] = useState(false);
  const [showEditTabListModal, setShowEditTabListModal] = useState(false);
  const [editingTabList, setEditingTabList] = useState(null);
  const [loadingTabLists, setLoadingTabLists] = useState(false);
  const [activeTabList, setActiveTabList] = useState(null); // Текущий открытый список
  const [viewTabList, setViewTabList] = useState(false);//видимость списков вкладок
  const [tabsName, setTabsName] = useState([]);// Убираем tabsName и храним названия в самих объектах savedTabLists
  // дипсик доп sql запрос делает, мне не нравится, пересмотреть логику, надо ли в каждой вкладке содержание
  // надо в любом случае зайдествовать бэк, например передавать название знаний в роуте /get_tab_lists/

  // СОСТОЯНИЯ ДЛЯ БЕСКОНЕЧНОГО СКРОЛЛА СПИСКОВ ВКЛАДОК с кнопкой
  const [tabListsPage, setTabListsPage] = useState(1);
  const [hasMoreTabLists, setHasMoreTabLists] = useState(true);
  const [isLoadingMoreTabLists, setIsLoadingMoreTabLists] = useState(false);
  const [allTabLists, setAllTabLists] = useState([]); // Все загруженные списки вкладок
  const [tabListsTotal, setTabListsTotal] = useState(0);
  const TAB_LISTS_PER_PAGE = 2; // Количество списков на страницу

  


  // ЗАГРУЗКА СПИСКОВ ВКЛАДОК С ПАГИНАЦИЕЙ
  const loadSavedTabLists = async (page = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMoreTabLists(true);
    } else {
      setLoadingTabLists(true);
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
      
      // ДОБАВЛЯЕМ ПОЛЕ viewListTab ДЛЯ КАЖДОГО СПИСКА
      const tabListsWithViewState = savedTabArray.map(item => ({
        ...item,
        viewListTab: false // По умолчанию свернуто
      }));
      
      if (isLoadMore) {
        // Добавляем к существующим данным
        setSavedTabLists(prev => [...prev, ...tabListsWithViewState]);
        setTabListsPage(page);
        setHasMoreTabLists(savedTabArray.length === TAB_LISTS_PER_PAGE);
      } else {
        // Первая загрузка
        setSavedTabLists(tabListsWithViewState);
        setTabListsPage(1);
        setHasMoreTabLists(savedTabArray.length === TAB_LISTS_PER_PAGE);
        setTabListsTotal(response.data.total || savedTabArray.length);
      }
      
    } catch (error) {
      console.error('Ошибка загрузки списков вкладок:', error);
    } finally {
      if (isLoadMore) {
        setIsLoadingMoreTabLists(false);
      } else {
        setLoadingTabLists(false);
      }
    }
  };

  useEffect(() => {
    loadSavedTabLists(1, false);
  }, []);

  // ЗАГРУЗКА СЛЕДУЮЩЕЙ СТРАНИЦЫ СПИСКОВ ВКЛАДОК
  const loadMoreTabLists = async () => {
    if (isLoadingMoreTabLists || !hasMoreTabLists) return;
    
    const nextPage = tabListsPage + 1;
    await loadSavedTabLists(nextPage, true);
  };



  // СОХРАНЕНИЕ ТЕКУЩИХ ВКЛАДОК КАК СПИСКА
  const saveCurrentTabsAsList = async (name, description) => {
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
      setSavedTabLists(prev => [response.data, ...prev]);
      setShowSaveTabListModal(false);
      
      // Показываем уведомление об успехе
      console.log('Список вкладок успешно сохранен!');
      
    } catch (error) {
      console.error('Ошибка сохранения списка вкладок:', error);
    }
  };


  // ОТКРЫТИЕ СОХРАНЕННОГО СПИСКА ВКЛАДОК
  const openSavedTabList = async (tabListId) => {
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
      setTabsName(
        knowledgeList.map(item => item.title)
        )


      // Закрываем все текущие вкладки
      setActiveTabs([]);
      
      // Последовательно открываем каждое знание из списка
      
      const newTabs = [];
      for (const knowledge of knowledgeList) {
        try {
             
          // const fullKnowledge = knowledge;
          
          newTabs.push({
            id: knowledge.id,
            title: knowledge.title,
            knowledge: knowledge,
            active: false // Пока неактивны, активируем последнюю позже
          });
        } catch (err) {
          console.error(`Не удалось загрузить знание ${knowledge.id}:`, err);
        }
      }
      
      // Активируем последнюю вкладку
      if (newTabs.length > 0) {
        newTabs[newTabs.length - 1].active = true;
      }
      
      setActiveTabs(newTabs);
      setActiveTabList(tabListId); // Запоминаем какой список открыт
      
    } catch (error) {
      console.error('Ошибка открытия списка вкладок:', error);
    } finally {
      setLoading(false);
    }
  };


  // УДАЛЕНИЕ СПИСКА ВКЛАДОК
  const deleteSavedTabList = async (tabListId, event) => {
    event.stopPropagation(); // Предотвращаем открытие списка при удалении
    
    if (!window.confirm('Вы уверены, что хотите удалить этот список вкладок?')) {
      return;
    }
    
    try {
      await API.delete(`/delete_tab_list/${tabListId}`);
      
      // Обновляем локальное состояние
      setSavedTabLists(prev => prev.filter(list => list.id !== tabListId));
      
      // Если удаляемый список был активным - сбрасываем активный список
      if (activeTabList === tabListId) {
        setActiveTabList(null);
      }
      
    } catch (error) {
      console.error('Ошибка удаления списка вкладок:', error);
    }
  };


  // РЕДАКТИРОВАНИЕ СПИСКА ВКЛАДОК
  const startEditingTabList = (tabList, event) => {
    event.stopPropagation();
    setEditingTabList(tabList);
    setShowEditTabListModal(true);
  };

  const updateTabList = async (name, description) => {
    try {
      const updateData = {
        id: editingTabList.id,
        name,
        description
      };

      const response = await API.patch('/change_tab_list/', updateData);
      
      // Обновляем локальное состояние
      setSavedTabLists(prev => 
        prev.map(list => 
          list.id === editingTabList.id ? response.data : list
        )
      );
      
      setShowEditTabListModal(false);
      setEditingTabList(null);
      
    } catch (error) {
      console.error('Ошибка обновления списка вкладок:', error);
    }
  };

  // ОБНОВЛЕНИЕ АКТИВНОГО СПИСКА (при изменении вкладок)
  useEffect(() => {
    // Если активный список установлен, но вкладки изменились - сбрасываем активный список
    if (activeTabList && activeTabs.length === 0) {
      setActiveTabList(null);
    }
  }, [activeTabs, activeTabList]);

  
  const showTabsName = (tabId, event) => {
    if (event) {
      event.stopPropagation(); // Предотвращаем открытие списка при клике на кнопку
    }

    setSavedTabLists(prevItems => 
      prevItems.map(item => 
        item.id === tabId
          ? { ...item, viewListTab: !item.viewListTab }
          : item
      )
    );
  };

  

  //эффект для пагинации 
  useEffect(() => {
    setCurrentPage(1);

    // Сбрасываем поиск при смене группы
    setSearchTerm('');
    setActiveSearchTerm('');
    setIsSearchActive(false);

  }, [slug_gr]); // Срабатывает только при изменении slug_gr
	

  // ОСНОВНОЙ ЭФФЕКТ ДЛЯ ЗАГРУЗКИ ДАННЫХ
  useEffect(() => {
    const abortController = new AbortController();
    let isCurrent = true; 

    const fetchData = async () => {
      setLoading(true);
      setError('');    
      try {      

        // ФОРМИРУЕМ ПАРАМЕТРЫ ЗАПРОСА
        const params = {
          page: currentPage,
          per_page: perPage,
        };

        // ДОБАВЛЯЕМ ПАРАМЕТРЫ ПОИСКА ЕСЛИ АКТИВЕН
        if (isSearchActive && activeSearchTerm) {
          params.search = activeSearchTerm;
          params.search_type = searchType;
          params.use_fts = true; // Используем полнотекстовый поиск
        }

        // если есть фильтры по дате, то добавляем из в параметры
        // if (filter_create_date) {
        //   params.filter_create_date = filter_create_date;
        // }

        if (filter_change_date) {
          params.filter_change_date = filter_change_date;
        }

        const response = await API.get(
          `/knowledges_in_group/${slug_gr}`,
           { 
            params,
            signal: abortController.signal }
           );

        // Проверяем, актуален ли еще этот запрос. Это для предотврашения повторных запросов. Надо проверить это... 
        if (!isCurrent) return;      
              
        const data = response.data;        
        setKnowledges(data.items);
        setTotal(data.total);
        setTotalPages(data.total_pages);
        setHasNext(data.has_next);
        setHasPrev(data.has_prev);
        
      } catch (err) {

        if (!isCurrent) return;//доп проверка чтобы убрать повторные запросы

        if (err.name === 'AbortError') {
          console.log('Запрос прерван');
          return;
        }

        setError('Не удалось загрузить данные');
        console.error('Ошибка загрузки:', err);
      } finally {
        if (isCurrent) setLoading(false);//доп проверка чтобы убрать повторные запросы
        // setLoading(false);
      }
    };
    fetchData();
    return () => { 
      isCurrent = false;//доп проверка чтобы убрать повторные запросы
      abortController.abort();
    }
  }, [currentPage, perPage, slug_gr, activeSearchTerm, searchType, isSearchActive, filter_change_date]);
    
  if (knowledges?.error) {
    return (<h1>Ошибка: {knowledges?.error}. Пройдите авторизацию.</h1>)
  }

  /**
   * Обработчик изменения страницы
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  /**
   * Обработчик изменения количества элементов на странице
   */
  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setPerPage(newPerPage);
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении размера
  };

  // методы для поиска ниже

  // ОБРАБОТЧИКИ ПОИСКА
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);
  

  // ПОИСК ПО КНОПКЕ "НАЙТИ"
  const handleSearchSubmit = useCallback(() => {
    if (searchTerm.trim()) {
      setActiveSearchTerm(searchTerm.trim());
      setIsSearchActive(true);
      setCurrentPage(1);
    }
  }, [searchTerm]);

  // ПОИСК ПО КЛАВИШЕ ENTER
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  // ОЧИСТКА ПОИСКА
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setIsSearchActive(false);
    setCurrentPage(1);
  }, []);  

  const handleSearchTypeChange = useCallback((e) => {
    setSearchType(e.target.value);
    // Если поиск активен - перезапускаем его с новым типом
    if (isSearchActive && activeSearchTerm) {
      setCurrentPage(1);
    }
  }, [isSearchActive, activeSearchTerm]);

  //мемо компонент для поиска
  const searchBar = useMemo(() => (
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={clearSearch}
        onKeyPress={handleKeyPress}
        searchType={searchType}
        onSearchTypeChange={handleSearchTypeChange}
        isSearchActive={isSearchActive}
        loading={loading}
      />
    ), [
      searchTerm, searchType, isSearchActive, loading,
      handleSearchChange, handleSearchSubmit, clearSearch, 
      handleKeyPress, handleSearchTypeChange
    ]);




  // конец методов для поиска
  
  const openModalCreateKnowledge = () => {      
      setModalCreateKnowledge(true);
      };

  const handleCreateKnowledge = (newKnowledge, group_slug) => {   
	console.log("Новое знание", newKnowledge) 
	if (slug_gr === "all" || slug_gr === group_slug) {
		setKnowledges(prevKnowledge => [newKnowledge, ...prevKnowledge]);
	}    
    setModalCreateKnowledge(false);
  };

  
  //функция для переключения между вкладками     
  const switchTab = useCallback((tabId) => {
    setActiveTabs(prev => 
      prev.map((tab) => ({
        ...tab,
        active: tab.id === tabId // Активируем только выбранную вкладку
      }))
    );
  }, []);
   
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

      // ниже добавление вкладки и ее активация
      setActiveTabs((prev) => {
        // ШАГ 1: Деактивируем ВСЕ существующие вкладки
        const newTabs = prev.map((tab) => ({ ...tab, active: false }));

        // ШАГ 2: Ищем индекс вкладки с таким же ID
        const existingTabIndex = newTabs.findIndex((tab) => tab.id === knowledge.id);
        
        // ШАГ 3: Если нашли существующую вкладку
        if (existingTabIndex !== -1) {
          newTabs[existingTabIndex].active = true; // Активируем только ее
          return newTabs; // Возвращаем обновленный массив
        }

        // ШАГ 4: Если вкладки нет - добавляем новую
        return [
          ...newTabs, // Все существующие вкладки (деактивированные)
          {
            id: knowledge.id,
            title: knowledge.title, // Используем title из списка
            knowledge: fullKnowledge, // Полные данные
            active: true // Новая вкладка активна
          }
        ];
      }
      );
    } catch (error) {
      console.error('Не удалось открыть знание:', error);
    }    
    finally {
        setLoading(false);        
      }  
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
  }, []); // Нет зависимостей - функция стабильна

  // функция используется когда знание редактируется
  const updateTabKnowledge = useCallback((tabId, updatedKnowledge) => {    
    // если группа слева (slug_gr) не равна выбранной группе при редактировании шапки, то удаляем знание
    if (slug_gr !== updatedKnowledge.group.slug) {
      setKnowledges(prev => prev.filter(kn => kn.id !== tabId)); 
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
        );}      

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


  const deleteKnowledge = useCallback((KnId) => {     
    setKnowledges(prevKnowledges => 
    prevKnowledges.filter(knowledge => knowledge.id !== KnId)
    );
    
  }, []);  

  // Получаем активное знание
  const activeTab = activeTabs.find(tab => tab.active);

	return (
		<div className='container-knowledges-view'>
      <br/><br/>
      
      <div className="collapse-toggle">
        <button className="hidden-button" onClick={() => {setOpenListKnowledges(!openListKnowledges);}}>
              {openListKnowledges ? <FaChevronLeft /> : <FaChevronRight /> }
        </button>
        <br/><br/>
      </div>      

      {/* Левая панель со списком знаний */}
      <div className={`knowledges-list ${!openListKnowledges ? 'collapsed' : ''}`}>

                                      
                    {/* Шапка */}
                    <div className="knowledges-list-header">

                        <h1>Знания</h1>

                        {/* ПОИСКОВАЯ СТРОКА С КНОПКОЙ */}
                            
                            {searchBar}
                            
                            

                            {/*конец поисковой системы*/}
                       
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <button className="save-button" onClick={openModalCreateKnowledge}>
                              Добавить знание
                            </button>
                            {/* Селектор количества элементов */}
                            <div className="per-page-selector">
                              <label>Элементов на странице:</label>
                              <select value={perPage} onChange={handlePerPageChange}>
                                <option value="2">2</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                              </select>
                            </div>
                        </div>                    
                    </div>
                  
                    {/* ИНФОРМАЦИЯ О РЕЗУЛЬТАТАХ ПОИСКА */}
                      {isSearchActive && activeSearchTerm && (
                        <div className="search-info">
                          <p>
                            Результаты поиска: "{activeSearchTerm}" · Найдено: {total} записей
                            <button onClick={clearSearch} className="search-clear-link">
                              Очистить поиск
                            </button>
                          </p>
                        </div>
                      )}

                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>   
                    <h3>📚 Cписки знаний</h3>

                    {/* КНОПКА СОХРАНЕНИЯ ТЕКУЩИХ ВКЛАДОК */}
                        {activeTabs.length > 0 && (
                          <div>
                            <button 
                              // className="save-tabs-button"
                              className="save-button"
                              onClick={() => setShowSaveTabListModal(true)}
                              disabled={loading}
                            >
                              Сохранить открытые вкладки ({activeTabs.length})
                            </button>
                            
                          </div>
                        )}


                    <button className="toolbar-button" onClick={() => {setViewTabList(!viewTabList);}}>{viewTabList ? 'Свернуть 🢁' : 'Посмотреть 🢃' }</button>
                  </div>
                    


                        {/* СПИСОК СОХРАНЕННЫХ ВКЛАДОК */}
                        {viewTabList && 
                        <div className="saved-tab-lists-section">
                          
                          
                          {loadingTabLists ? (
                            <div className="loading-tab-lists">Загрузка списков...</div>
                          ) : (
                            <>
                              {savedTabLists.map(tabList => (
                                <div 
                                  key={tabList.id} 
                                  className={`saved-tab-list-item ${activeTabList === tabList.id ? 'active' : ''}`}
                                >
                                  <div className="tab-list-header">
                                    <div className="tab-list-title">
                                      <strong>{tabList.name}</strong>
                                      {activeTabList === tabList.id && (
                                        <>
                                        <span className="active-badge">● Открыт</span>
                                        <br/>
                                        
                                        <button 
                                          className="toggle-button" 
                                          onClick={(event) => showTabsName(tabList.id, event)}>
                                          Содержание<ArrowIcon isOpen={tabList.viewListTab} />
                                        </button>
                                        {tabList.viewListTab && 
                                        <>
                                        {tabsName.map(
                                          item => <div>- {item}</div>
                                          )}
                                        </>
                                        }
                                        
                                        </>
                                      )}
                                    </div>
                                    <div className="tab-list-actions">
                                      <button 
                                        className="edit-tab-list-btn"
                                        onClick={(e) => startEditingTabList(tabList, e)}
                                        title="Редактировать"
                                      >
                                        ✏️
                                      </button>
                                      <button 
                                        className="delete-tab-list-btn"
                                        onClick={(e) => deleteSavedTabList(tabList.id, e)}
                                        title="Удалить список"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {tabList.description && (
                                    <div className="tab-list-desc">{tabList.description}</div>
                                  )}

                                  <div className="tab-list-info">
                                    <span>🕒 {new Date(tabList.created_at).toLocaleDateString('ru-RU')}</span>
                                  </div>

                                  <button onClick={() => openSavedTabList(tabList.id)}>Открыть</button>
                                  
                                  
                                  
                                </div>
                              ))}

                              {/* КНОПКА "ЗАГРУЗИТЬ ДАЛЬШЕ" ДЛЯ СПИСКОВ ВКЛАДОК */}
                                <LoadMoreTabListsButton
                                  onClick={loadMoreTabLists}
                                  hasMore={hasMoreTabLists}
                                  isLoading={isLoadingMoreTabLists}
                                  loadedCount={savedTabLists.length}
                                  total={tabListsTotal}
                                />
                              
                              {savedTabLists.length === 0 && (
                                <div className="no-tab-lists">
                                  <p>Нет сохраненных списков знаний</p>
                                  <small>Сохраните открытые знания, чтобы быстро возвращаться к ним</small>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        }

                    {/* Прокручиваемая область списка */}                  
                    <div>
                      <br/>
                      {/* Информация о пагинации */}          
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div className="pagination-info">                        
                                Показано {knowledges.length} из {total} записей
                            </div>

                            <button className='sort-date' onClick={() => {setFilter_change_date(!filter_change_date);}} disabled={loading}>{filter_change_date ? 'Дата ▲' : 'Дата ▼'}</button>
                      </div>
                      <br/>
                      {/* Список знаний */}
                      {knowledges?.map((knowledge) => (
                        <div key={knowledge.id}>
                          <div className="section-frame">
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <h3 className="name-knowledge">{knowledge.title}</h3>
                              <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {new Date(knowledge.updated_at).toLocaleString('ru-RU')}</span>
                              
                              
                              
                            </div>
                            <p>Описание: {knowledge.description}</p>

                            {/* ОТОБРАЖЕНИЕ РЕЛЕВАНТНОСТИ ЕСЛИ ЕСТЬ */}
                            {knowledge.relevance_score !== undefined && (
                              <div className="relevance-badge">
                                Релевантность: {(knowledge.relevance_score * 100).toFixed(1)}%
                              </div>
                            )}

                            <button onClick={() => openKnowledgeInTab(knowledge)} className="toolbar-button">
                              Открыть
                            </button>
                          </div>
                          <br/>
                        </div>
                      ))}
                      {/* Сообщение если нет данных */}
                      {knowledges.length === 0 && !loading && (
                        <div className="no-data">Нет данных для отображения</div>
                      )}
                    </div>                  

                    {/* Пагинация - фиксированная внизу */}
                    <div className="knowledges-list-footer">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        hasNext={hasNext}
                        hasPrev={hasPrev}
                      />
                    </div>                  
    </div>

      {/* Правая часть с вкладками и контентом */}
      <div className="knowledge-tabs-container">
        {/* Панель вкладок */}
        <KnowledgeTabs
          tabs={activeTabs}
          onCloseTab={closeTab}
          onSwitchTab={switchTab}
        />

        <br/>

        {/* Область контента активной вкладки */}
        <div className="knowledge-content-area">
          {activeTab ? (
            <KnowledgeOpenContent
              knowledge={activeTab.knowledge}
              onCloseTab={closeTab}
              onUpdate={updateTabKnowledge}
              onDeleteKnowledge={deleteKnowledge}
            />
          ) : (
            <div className="no-content-message">
              <h2>Выберите знание для просмотра</h2>
            </div>
          )}
        </div>
      </div>

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
          />
        )}

    </div>
		)
}



export { KnowledgeInGroup }


