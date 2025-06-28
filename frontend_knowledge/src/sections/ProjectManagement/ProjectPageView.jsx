import { useParams, Link, useNavigate, useLoaderData, Await, useAsyncValue, NavLink } from 'react-router-dom'
import { React, Suspense, useState, useEffect } from 'react';
import Cookies from "js-cookie";
// import { API } from "../../apiAxios/apiAxios"
import axios from "axios"


function ProjectPageView() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {projectLoad} = useLoaderData()

	const [projects, setProjects] = useState(projectLoad);
	const [loading, setLoading] = useState(false);

	// const fetchKnowledges = async () => {
  //   setLoading(true);
  //   try {      
  //     const response = await axios.get("http://127.0.0.1:8000/knowledge_all/");
  //     setKnowledges(response.data)
  //   } catch (err) {
  //     setError(err.message);      
  //   } finally {
  //     setLoading(false);
  //   }
  // 	};

	// useEffect(() => {	    
  //       fetchKnowledges()
	// }, [])


	const navigate = useNavigate();

  
	
	const create_knowledge = () => {
      return navigate("/knowledge/create/");
    }

	return (
		<>			

			<div className="list-knowledge">
			<h1>Менеджер проектов</h1>
				{/*<button className="add-button"><NavLink to="/group/create/" className={setActive}>Добавить группу</NavLink></button>*/}
				{/*<button className="toolbar-button" onClick={create_group}>Добавить группу</button>
				&nbsp;&nbsp;&nbsp;
				<button className="toolbar-button" onClick={create_knowledge}>Добавить знание</button>*/}
				{/*<button className="add-button"><NavLink to="/knowledge/create/" className={setActive}>Добавить запись в базе знаний</NavLink></button>*/}
				

						{
                projects?.map(project => (
                				<>
                				<h1 className="name-knowledge">{project.title}</h1>
                        <h2>Описание: {project.description}</h2>
                        <NavLink key={project.id} to={`/project/open/${project.id}`} className={setActive}>
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


async function getProjectList() { 
  const res = await fetch("http://127.0.0.1:8000/project_all/")//тут берутся все элементы с одним и тем же номером документа

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


const ProjectListLoader = async () => {  
  return {projectLoad: await getProjectList()}
}




export { ProjectPageView, ProjectListLoader }
