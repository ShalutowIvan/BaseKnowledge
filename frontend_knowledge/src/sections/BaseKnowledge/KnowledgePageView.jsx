import { useParams, Link, useNavigate, useLoaderData, Await, useAsyncValue, NavLink } from 'react-router-dom'
import { React, Suspense, useState, useEffect } from 'react';
import Cookies from "js-cookie";
// import { API } from "../../apiAxios/apiAxios"
import axios from "axios"
import { GroupsAll } from "./GroupsAll"


// сделать гдето тут кнопку для удаления группы и наверно надо еще переимнование сделать

function KnowledgePageView() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {knowledgeLoad} = useLoaderData()

	const [knowledges, setKnowledges] = useState(knowledgeLoad);
	const [loading, setLoading] = useState(true);

	
	const navigate = useNavigate();

  const create_group = () => {
      return navigate("/knowledges/group/create/");
    }
	
	const create_knowledge = () => {
      return navigate("/knowledges/create/");
    }

	return (
		<>
			
			<div className="list-knowledge">
			  <div className='header-section'>
        <h1>Знания</h1>				
				<button className="toolbar-button" onClick={create_group}>Добавить группу</button>
				&nbsp;&nbsp;&nbsp;
				<button className="toolbar-button" onClick={create_knowledge}>Добавить знание</button>
				</div>
				

						{
                knowledges?.map(knowledge => (
                				<>
                				<h1 className="name-knowledge">{knowledge.title}</h1>
                        <h2>Описание: {knowledge.description}</h2>
                        <NavLink key={knowledge.id} to={`/knowledges/open/${knowledge.id}`} className={setActive}>
                            <button className="toolbar-button">Открыть</button>
                        </NavLink>
                            <p>_____________________________________________________________</p>
                        </>
                    ))
            }
      </div>


								
		</>
		)
}


async function getKnowledgeList() { 
  const res = await fetch("http://127.0.0.1:8000/knowledge_all/")//тут берутся все элементы с одним и тем же номером документа

  // try {
  //       const res = await API.get(`/api/checkout_list/orders/${id}`)     
  //  return res.data
  //     } catch (error) {
  //      //если ошибка, то выдаем ошибку
  //       console.error("Error here: ", error);
  //       // setError("Failed to fetch user data. Please try again.");
  //       return "error"
  //     }

  return res.json()
}


const KnowledgeListLoader = async () => {  
  return {knowledgeLoad: await getKnowledgeList()}
}




export { KnowledgePageView, KnowledgeListLoader }
