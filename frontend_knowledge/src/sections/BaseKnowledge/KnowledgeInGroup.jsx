//компонент отображения содержания знаний в группе

import { useParams, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { API } from "../../apiAxios/apiAxios"


function KnowledgeInGroup() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {slug} = useParams();
	const [knowledges, setKnowledges] = useState([]);
	
	useEffect(() => {
        const fetchData = async () => {
        try {
          const response = await API.get(`/knowledges_in_group/${slug}`);
          setKnowledges(response.data);
          setLoading(false);
        } catch (err) {
          setError(err);
          setLoading(false);
        }
        };        
        fetchData();
    }, [slug])

	return (
		<>		
			
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
	        
		</>
		)
}



export { KnowledgeInGroup }


