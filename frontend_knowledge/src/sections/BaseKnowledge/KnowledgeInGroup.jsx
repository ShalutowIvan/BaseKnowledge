//компонент отображения содержания знаний в группе
import { useParams, NavLink, useLoaderData } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API } from "../../apiAxios/apiAxios"
import { KnowledgeCreateModal } from './KnowledgeCreateModal'



function KnowledgeInGroup() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {slug_gr} = useParams();
	const {knowledgeLoad} = useLoaderData()
	const [knowledges, setKnowledges] = useState([]);
	const [modalCreateKnowledge, setModalCreateKnowledge] = useState(false);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

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
    }, [slug_gr])


  const openModalCreateKnowledge = () => {      
      setModalCreateKnowledge(true);
      };


  const handleCreateKnowledge = (newKnowledge) => {    
    setKnowledges(prevKnowledge => [newKnowledge, ...prevKnowledge]);
    setModalCreateKnowledge(false);
    };

	return (
		<>
			<h1>Знания</h1>
          
          
      <button className="save-button" onClick={openModalCreateKnowledge}>Добавить знание</button>
      <br/>
			
	            {
	                	knowledges?.map(knowledge => (
	                				<>
	                				<br/>
	                				<div className="section-frame">
		                				<h1 className="name-knowledge">{knowledge.title}</h1>
				                        <h2>Описание: {knowledge.description}</h2>
				                        <NavLink key={knowledge.id} to={`/knowledges/open/${knowledge.id}`} className={setActive}>
				                            <button className="toolbar-button">Открыть</button>
				                        </NavLink>
	                            	</div>
	                        		</>
	                    ))
	            }

	     {modalCreateKnowledge && (
            <KnowledgeCreateModal             
              onClose={() => setModalCreateKnowledge(false)}
              onSuccess={handleCreateKnowledge}
            />
          )}  
	        
		</>
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


