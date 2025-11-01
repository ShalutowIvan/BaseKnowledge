//компонент отображения содержания знаний в группе
import { useParams, NavLink, useLoaderData, Outlet } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { API } from "../../apiAxios/apiAxios"
import { KnowledgeCreateModal } from './KnowledgeCreateModal'
import { KnowledgeTabs } from './KnowledgeTabs';
import { KnowledgeOpenContent } from './KnowledgeOpenContent';


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


  // Функция для переключения между вкладками
  const openKnowledgeInTab = useCallback((knowledge) => {
    setActiveTabs(prev => {
      const newTabs = prev.map(tab => ({ ...tab, active: false }));
      const existingTabIndex = newTabs.findIndex(tab => tab.id === knowledge.id);
      
      if (existingTabIndex !== -1) {
        newTabs[existingTabIndex].active = true;
        return newTabs;
      }

      return [
        ...newTabs,
        {
          id: knowledge.id,
          title: knowledge.title,
          knowledge: { ...knowledge },
          active: true
        }
      ];
    });
  }, []);

  // Функция для закрытия вкладки
  const closeTab = useCallback((tabId) => {
    setActiveTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);
      if (filtered.length === 0) return filtered;
      
      // Активируем последнюю вкладку если закрыли активную
      const wasActive = prev.find(tab => tab.id === tabId)?.active;
      if (wasActive) {
        filtered[filtered.length - 1].active = true;
      }
      
      return filtered;
    });
  }, []);

  // Функция для переключения между вкладками
  const switchTab = useCallback((tabId) => {
    setActiveTabs(prev => 
      prev.map(tab => ({
        ...tab,
        active: tab.id === tabId
      }))
    );
  }, []);

  const updateTabKnowledge = useCallback((tabId, updatedKnowledge) => {
    setActiveTabs(prev => 
      prev.map(tab => 
        tab.id === tabId 
          ? { ...tab, knowledge: updatedKnowledge, title: updatedKnowledge.title }
          : tab
      )
    );
  }, []);

  // Получаем активное знание
  const activeTab = activeTabs.find(tab => tab.active);

	return (
		<div className='container-knowledges-view'>
		{/* Левая панель со списком знаний */}
		<div className='knowledges-section'>
		<h1>Знания</h1>
		<button className="save-button" onClick={openModalCreateKnowledge}>Добавить знание</button>
     <br/>			
	            {
	                	knowledges?.map(knowledge => (
	                				<>
	                				<br/>
	                				<div key={knowledge.id} className="section-frame">
		                				<h3 className="name-knowledge">{knowledge.title}</h3>
				                    <p>Описание: {knowledge.description}</p>
				                        <NavLink to={`/knowledges/${slug_gr}/knowledge_open/${knowledge.id}`} className={setActive}>
				                            <button className="toolbar-button">Открыть</button>
				                        </NavLink>
	                            	</div>
	                        		</>
	                    ))
	            }
		
		
		</div>


	     {modalCreateKnowledge && (
            <KnowledgeCreateModal             
              onClose={() => setModalCreateKnowledge(false)}
              onSuccess={handleCreateKnowledge}
            />
          )}  

		<div>
        	<Outlet />
      	</div>

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


