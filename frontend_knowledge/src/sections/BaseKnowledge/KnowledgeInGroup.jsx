//компонент отображения содержания знаний в группе
import { useParams, NavLink, useLoaderData, Outlet } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { API } from "../../apiAxios/apiAxios"
import { KnowledgeCreateModal } from './KnowledgeCreateModal'
import { KnowledgeTabs } from './KnowledgeTabs';
import KnowledgeOpenContent from './KnowledgeOpenContent';


function KnowledgeInGroup() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {slug_gr} = useParams();
	const {knowledgeLoad} = useLoaderData()
	const [knowledges, setKnowledges] = useState([]);
	const [modalCreateKnowledge, setModalCreateKnowledge] = useState(false);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Состояние для активных вкладок
  const [activeTabs, setActiveTabs] = useState([]);

  // const [knowledgeCache, setKnowledgeCache] = useState(new Map()); // Кэш полных данных

	if (knowledgeLoad?.error) {
    return (<h1>Ошибка: {knowledgeLoad?.error}. Пройдите авторизацию.</h1>)
  }
	
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
  }, []); // Стабильная ссылка на функцию


   /**
   * Мемоизированная функция для открытия знания во вкладке
   * Загружает полные данные только при необходимости
   */
  const openKnowledgeInTab = useCallback(async (knowledge) => {
    
      // Если у нас уже есть полные данные в кэше - используем их
      // let fullKnowledge = knowledgeCache.get(knowledge.id);
      
      // Если нет - загружаем
      // if (!fullKnowledge) {
      //   fullKnowledge = await loadFullKnowledge(knowledge.id);
      // }

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


  

  /**
   * Мемоизированная функция для обновления данных вкладки
   * Используется когда знание редактируется и нужно обновить заголовок вкладки
   */
  const updateTabKnowledge = useCallback((tabId, updatedKnowledge) => {
     // Обновляем кэш
      // setKnowledgeCache((prev) => {
      //   const newCache = new Map(prev);
      //   newCache.set(tabId, updatedKnowledge);
      //   return newCache;
      // });
    // console.log("знание: ", updatedKnowledge)
    // // если меняется группа знания то меняем и список знаний
    // setKnowledges(prev => 
    //   prev.map(kn => 
    //     kn.id === tabId ? {
    //       ...kn, 

    //     }
    //     )
    //   )

    setActiveTabs(prev => 
      prev.map(tab => 
        tab.id === tabId 
          ? { 
              ...tab, 
              knowledge: updatedKnowledge, 
              title: updatedKnowledge.title // Обновляем заголовок вкладки
            }
          : tab
      )
    );
  }, []); // Функция создается один раз

// условия для изменения группы

// проще

// если группа слева не равна выбранной группе при редактировании шапки фильтруем знания на неравенство ид знания(удаление знания) если знания там не было то ничего не произойдет

// если группа слева равна выбранной группе при редактировании шапки и если знания в списке нет, то добавляем знание(добавление знания)


  const deleteKnowledge = useCallback((KnId) => {     
    setKnowledges(prevKnowledges => 
    prevKnowledges.filter(knowledge => knowledge.id !== KnId)
    );
    
  }, []);
  

  // Получаем активное знание
  const activeTab = activeTabs.find(tab => tab.active);

  // ост тут, jsx пока не проверял

	return (
		<div className='container-knowledges-view'>
		{/* Левая панель со списком знаний */}
		<div className='knowledges-section'>
		<h1>Знания</h1>
		<button className="save-button" onClick={openModalCreateKnowledge}>Добавить знание</button>
     <br/>			
	            {
	                	knowledges?.map((knowledge) => (
	                				
	                				
	                				<div key={knowledge.id} className="section-frame">
		                				<h3 className="name-knowledge">{knowledge.title}</h3>
				                    <p>Описание: {knowledge.description}</p>
				                        <button onClick={() => openKnowledgeInTab(knowledge)} className="toolbar-button">
                                  Открыть</button>				                        
	                       	</div>
	                      
	                    ))
	            }		
		</div>

		{/* Панель вкладок - получает стабильные функции через useCallback */}
      <KnowledgeTabs
        tabs={activeTabs}
        onCloseTab={closeTab}       // Стабильная ссылка
        onSwitchTab={switchTab}     // Стабильная ссылка
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
            <h2>Выберите знание для просмотра</h2>
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


