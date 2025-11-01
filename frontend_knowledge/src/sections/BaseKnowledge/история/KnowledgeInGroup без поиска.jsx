//компонент отображения содержания знаний в группе
import { useParams, NavLink, useLoaderData, Outlet } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { API } from "../../apiAxios/apiAxios"
import { KnowledgeCreateModal } from './KnowledgeCreateModal'
import { KnowledgeTabs } from './KnowledgeTabs';
import KnowledgeOpenContent from './KnowledgeOpenContent';
import Pagination from './Pagination/Pagination';
import './Pagination/PaginationList.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';


function KnowledgeInGroup() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {slug_gr} = useParams();
		
	const [modalCreateKnowledge, setModalCreateKnowledge] = useState(false);

  //состояние открыт ли список вкладок
  const [openListKnowledges, setOpenListKnowledges] = useState(true);

  const [knowledges, setKnowledges] = useState([]);
  // состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);//номер текущей страницы
  const [perPage, setPerPage] = useState(10);//максимально элементов на одной странице
  const [total, setTotal] = useState(0);//всего элементов в загрузке
  const [totalPages, setTotalPages] = useState(0);//всего страниц в соответствии с количеством элементов
  const [hasNext, setHasNext] = useState(false);//есть ли следующий
  const [hasPrev, setHasPrev] = useState(false);//есть ли предыдущий

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Состояние для активных вкладок
  const [activeTabs, setActiveTabs] = useState([]);

  // 🔥 СОСТОЯНИЯ ДЛЯ ПОИСКА
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // Текущий активный поисковый запрос
  const [searchType, setSearchType] = useState('plain'); // plain, phrase, advanced
  const [isSearchActive, setIsSearchActive] = useState(false); // Флаг активного поиска

  // понять зачем второе состояние activeSearchTerm для поиска


  
  useEffect(() => {
    setCurrentPage(1);

    // Сбрасываем поиск при смене группы
    setSearchTerm('');
    setActiveSearchTerm('');
    setIsSearchActive(false);

  }, [slug_gr]); // Срабатывает только при изменении slug_gr
	

  // 🔥 ОСНОВНОЙ ЭФФЕКТ ДЛЯ ЗАГРУЗКИ ДАННЫХ
  useEffect(() => {
    const abortController = new AbortController();
    let isCurrent = true; 

    const fetchData = async () => {
      setLoading(true);
      setError('');    
      try {      

        // 🔥 ФОРМИРУЕМ ПАРАМЕТРЫ ЗАПРОСА
        const params = {
          page: currentPage,
          per_page: perPage,
        };

        // 🔥 ДОБАВЛЯЕМ ПАРАМЕТРЫ ПОИСКА ЕСЛИ АКТИВЕН
        if (isSearchActive && activeSearchTerm) {
          params.search = activeSearchTerm;
          params.search_type = searchType;
          params.use_fts = true; // Используем полнотекстовый поиск
        }


        const response = await API.get(
          `/knowledges_in_group/${slug_gr}?page=${currentPage}&per_page=${perPage}`,
           { signal: abortController.signal }
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
  }, [currentPage, perPage, slug_gr]);
  

  // если номер страницы больше 1 и slug_gr из параметра не равен slug_gr из 


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



  /**
   * Мемоизированная функция для переключения между вкладками
   * useCallback обеспечивает, что ссылка на функцию не меняется
   * Это предотвращает ненужные перерисовки дочерних компонентов
   */
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
  // }, [knowledgeCache, loadFullKnowledge]);
  }, []);

  
  /**
   * Мемоизированная функция для закрытия вкладки
   * useCallback сохраняет ссылку на функцию между рендерами
   * Это важно для стабильности пропсов в дочерних компонентах
   */
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
  }, [slug_gr, knowledges]); //зависимости, чтобы функция срабатывала при изменении слага и знания


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



                    {/* Прокручиваемая область списка */}                  
                    <div>
                      <br/>
                      {/* Информация о пагинации */}          
                      <div className="pagination-info">
                        Показано {knowledges.length} из {total} записей
                      </div>                        
                      <br/>
                      {/* Список знаний */}
                      {knowledges?.map((knowledge) => (
                        <div key={knowledge.id}>
                          <div className="section-frame">
                            <h3 className="name-knowledge">{knowledge.title}</h3>
                            <p>Описание: {knowledge.description}</p>
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
    </div>
		)
}



// async function getKnowledgeList(slug) {  

//   try {
//         const res = await API.get(`/knowledges_in_group/${slug}`);
//         // console.log(res)
//         return res.data
//       } catch (error) {
       
//         console.log("Ошибка из detail:", error.response?.data?.detail)
                
//         return {"error": error.response?.data?.detail}
//       }

  
// }


// const KnowledgesInGroupLoader = async ({params}) => {

// 	const slug = params.slug_gr

// 	const requestKnowledge = await getKnowledgeList(slug)

//   return {knowledgeLoad: requestKnowledge}
// }



export { KnowledgeInGroup }


