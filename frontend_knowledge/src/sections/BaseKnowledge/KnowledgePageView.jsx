import { useParams, Link, useNavigate, useLoaderData, Await, useAsyncValue, NavLink } from 'react-router-dom'
import { React, Suspense, useState, useEffect } from 'react';
import Cookies from "js-cookie";
// import { API } from "../../apiAxios/apiAxios"
import axios from "axios"
import { GroupsAll } from "./GroupsAll"

function KnowledgePageView() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const [knowledges, setKnowledges] = useState([]);
	const [loading, setLoading] = useState(false);

	const fetchKnowledges = async () => {
    setLoading(true);
    try {      
      const response = await axios.get("http://127.0.0.1:8000/knowledge_all/");
      setKnowledges(response.data)
    } catch (err) {
      setError(err.message);      
    } finally {
      setLoading(false);
    }
  	};

	useEffect(() => {	    
        fetchKnowledges()
	}, [])

	

	return (
		<>

		  <GroupsAll />

			<h1>База знаний</h1>
				<button><NavLink to="/group/create/" className={setActive}>Добавить группу</NavLink></button>
				&nbsp;&nbsp;&nbsp;
				<button><NavLink to="/knowledge/create/" className={setActive}>Добавить запись в базе знаний</NavLink></button>
				

			{
                knowledges?.map(knowledge => (
                				<>
                				<h1>Название знания: {knowledge.title}</h1>
                        <h2>Описание: {knowledge.description}</h2>
                        <NavLink key={knowledge.id} to={`/knowledge/open/${knowledge.slug}`} className={setActive}>
                            <button>Открыть</button>
                        </NavLink>
                            <p>_____________________________________________________________</p>
                        </>
                    ))
            }


								
		</>
		)
}







export { KnowledgePageView }
