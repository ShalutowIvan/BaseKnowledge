import { useParams, Link, useNavigate, useLoaderData, Await, useAsyncValue, NavLink } from 'react-router-dom'
import { React, Suspense, useState, useEffect, Fragment } from 'react';
import Cookies from "js-cookie";
import { API } from "../../apiAxios/apiAxios"



function KnowledgeIndex() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {knowledgeLoad} = useLoaderData()

	const [knowledges, setKnowledges] = useState(knowledgeLoad);
	const [loading, setLoading] = useState(true);	

  if (knowledgeLoad?.error) {
    return (<h1>Ошибка: {knowledgeLoad?.error}. Пройдите авторизацию.</h1>)
  }

	return (
		<>			
				{
            knowledges?.map(knowledge => (
            				<Fragment key={knowledge.id}>
            				<br/>
            				<div className="section-frame" >
              				<h1 className="title-element">{knowledge.title}</h1>
                      <h2>Описание: {knowledge.description}</h2>
                      <NavLink to={`/knowledges/open/${knowledge.id}`} className={setActive}>
                          <button className="toolbar-button">Открыть</button>
                      </NavLink>
                    </div>    
                    </Fragment>
                ))
        }
    </>
		)
}


async function getKnowledgeList() {  

  try {
        const res = await API.get(`/knowledge_all/`)
        // console.log(res)
        return res.data
      } catch (error) {
       
        console.log("Ошибка из detail:", error.response?.data?.detail)
                
        return {"error": error.response?.data?.detail}
      }

  
}


const KnowledgeListLoader = async () => {  
  return {knowledgeLoad: await getKnowledgeList()}
}




export { KnowledgeIndex, KnowledgeListLoader }
