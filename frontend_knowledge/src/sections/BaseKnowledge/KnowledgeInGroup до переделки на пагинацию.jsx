//компонент отображения содержания знаний в группе
import { useParams, NavLink, useLoaderData, Outlet } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { API } from "../../apiAxios/apiAxios"
import { KnowledgeCreateModal } from './KnowledgeCreateModal'
import { KnowledgeTabs } from './KnowledgeTabs';
import KnowledgeOpenContent from './KnowledgeOpenContent';


function KnowledgeInGroup() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {slug_gr} = useParams();
	const {knowledgeLoad} = useLoaderData()
	
	const [modalCreateKnowledge, setModalCreateKnowledge] = useState(false);

  const [knowledges, setKnowledges] = useState([]);
  // состояния для пагинации
  const [currentPage, setCurrentPage] = useState(1);//номер текущей страницы
  const [perPage, setPerPage] = useState(20);//максимально элементов на одной странице
  const [total, setTotal] = useState(0);//всего элементов в загрузке
  const [totalPages, setTotalPages] = useState(0);//всего страниц в соответствии с количеством элементов
  const [hasNext, setHasNext] = useState(false);//есть ли следующий
  const [hasPrev, setHasPrev] = useState(false);//есть ли предыдущий

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Состояние для активных вкладок
  const [activeTabs, setActiveTabs] = useState([]);

	if (knowledgeLoad?.error) {
    return (<h1>Ошибка: {knowledgeLoad?.error}. Пройдите авторизацию.</h1>)
  }


  const fetchItems = async (page, limit) => {
    setLoading(true);
    setError('');
    
    try {
      // Формируем URL с параметрами пагинации
      // const url = `http://localhost:8000/items?page=${page}&per_page=${limit}`;
      
      // const response = await fetch(url);
      const response = await API.get(`/knowledges_in_group/${slug_gr}`);
      
      // if (!response.ok) {
      //   throw new Error(`Ошибка HTTP: ${response.status}`);
      // }
      
      const data = response.data;
      
      // Обновляем состояния данными из ответа
      setKnowledges(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
      setPerPage(data.per_page);
      setHasNext(data.has_next);
      setHasPrev(data.has_prev);
      
    } catch (err) {
      setError('Не удалось загрузить данные');
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };



	
	useEffect(() => {
      const fetchData = async () => {
	    try {

	      if (knowledgeLoad && !knowledgeLoad.error) {
	          // Убедимся, что groupsLoad - массив
	          const knowledgesArray = Array.isArray(knowledgeLoad) ? knowledgeLoad : [];
	          setKnowledges(knowledgesArray);
	          }

	      setLoading(false);
	    } catch (err) {
	      setError(err.response?.data?.detail);
	      console.log("Ошибка из лейаут", err.response?.data?.detail)
	      setLoading(false);
	    }
	    };
	    fetchData()
    }, [knowledgeLoad])


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
  }, []);  на функцию

   
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
		{/* Левая панель со списком знаний */}
		<div className='knowledges-list'>
		<h1>Знания</h1>
		<button className="save-button" onClick={openModalCreateKnowledge}>Добавить знание</button>    
     <br/><br/>
	            {
	                	knowledges?.map((knowledge) => (
                          <div key={knowledge.id}>
  	                				<div className="section-frame">
  		                				<h3 className="name-knowledge">{knowledge.title}</h3>
  				                    <p>Описание: {knowledge.description}</p>
  				                        <button onClick={() => openKnowledgeInTab(knowledge)} className="toolbar-button">
                                    Открыть</button>                            
  	                       	</div>
                            <br/>
                          </div>
	                      
	                    ))
	            }		
		</div>

		{/* Панель вкладок - получает стабильные функции через useCallback */}
      <KnowledgeTabs
        tabs={activeTabs}
        onCloseTab={closeTab}       
        onSwitchTab={switchTab}     
      />


    {/* Область контента активной вкладки */}
      <div className="knowledge-content-area">
        {activeTab ? (
          <KnowledgeOpenContent
            knowledge={activeTab.knowledge}            
            onCloseTab={closeTab}
            onUpdate={updateTabKnowledge} // обновление данных в массиве вкладок - состояние массива вкладок
            onDeleteKnowledge={deleteKnowledge}
          />
        ) : (
          <div className="no-content-message">
            <h2 style={{ marginTop: '50px', marginLeft: '50px', color: 'white' }}>Выберите знание для просмотра</h2>
          </div>
        )}
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



async function getKnowledgeList(slug) {  

  try {
        const res = await API.get(`/knowledges_in_group/${slug}`);
        // console.log(res)
        return res.data
      } catch (error) {
       
        console.log("Ошибка из detail:", error.response?.data?.detail)
                
        return {"error": error.response?.data?.detail}
      }

  
}


const KnowledgesInGroupLoader = async ({params}) => {

	const slug = params.slug_gr

	const requestKnowledge = await getKnowledgeList(slug)

  return {knowledgeLoad: requestKnowledge}
}



export { KnowledgeInGroup, KnowledgesInGroupLoader }


