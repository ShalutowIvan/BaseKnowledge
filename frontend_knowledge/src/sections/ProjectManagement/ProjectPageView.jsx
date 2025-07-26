import { useParams, Link, useNavigate, useLoaderData, Await, useAsyncValue, NavLink } from 'react-router-dom'
import { React, Suspense, useState, useEffect } from 'react';
import Cookies from "js-cookie";
import { API } from "../../apiAxios/apiAxios"
import axios from "axios"
import { ProjectCreateModal } from './ProjectCreateModal'

import { updateAccessTokenFromRefreshToken } from "../../regusers/AuthService"


function ProjectPageView() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {projectLoad} = useLoaderData()
	const [projects, setProjects] = useState(projectLoad);


  // const [projects, setProjects] = useState([]);

  const navigate = useNavigate();  

	const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);

  

  // useEffect(() => {
  //     const fetchProjects = async () => {
  //       try {
  //         const res = await API.get(`/project_all/`);
  //         setProjects(res.data);
  //         setError(null);
  //       } catch (error) {
  //         if (error.response?.data?.detail?.error_code === "access_denied") {
  //           setError("access_denied");
  //         } else {
  //           setError("unknown_error");
  //         }
  //       } finally {
  //         setLoading(false);
  //       }
  //     };

  //     fetchProjects();
  //   }, []);

   
   // if (loading) {
   //  return <p>Загрузка...</p>;
   //  }

  // if (error === "access_denied") {
  //   return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {error}. Пройдите авторизацию.</h1>
  // }


	if (projectLoad.error === "401_UNAUTHORIZED") {  
    return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {projectLoad["error"]}. Пройдите авторизацию.</h1>
  	}


  const openModalClick = () => {      
      setModalOpen(true);
      };

  
  const handleCreateSuccess = (newProject) => {
    // Используем функциональную форму setProjects
    console.log("Новый проект", newProject)
    setProjects(prevProjects => [newProject, ...prevProjects]);
    setModalOpen(false);
    };


	return (
		<>			
      
			
			<div className='projects-view'>
        <h1>Проекты</h1>
        <button className="toolbar-button" onClick={openModalClick}>Создать проект</button>
            
        
        <br/><br/>

        {
                  projects?.map(project => (
                        <>
                          <div className='project-section'>
                          <h1 className="name-knowledge">{project.title}</h1>
                          <h2>Описание: {project.description}</h2>
                          <NavLink key={project.id} to={`/projects/open/${project.id}`} className={setActive}>
                              <button className="toolbar-button">Открыть</button>
                          </NavLink>
                              <p>_____________________________________________________________</p>
                          </div>
                          <br/>
                        </>
                      ))
              }
      </div>


      {modalOpen && (
		        <ProjectCreateModal		          
		          onClose={() => setModalOpen(false)}
		          onSuccess={handleCreateSuccess}
		        />
		      )}
      
            		      
      								
		</>
		)
}


async function getProjectList() { 
  // const res = await fetch("http://127.0.0.1:8000/project_all/")//тут берутся все элементы с одним и тем же номером документа

  try {
        const res = await API.get(`http://127.0.0.1:8000/project_all/`)
        console.log(res)
        return res.data
      } catch (error) {
       
        console.log("Ошибка из detail:", error.response?.data?.detail)
        // console.log("Статус ответа:", error.response?.status)       

        
        // return {"error": error.response?.data?.detail.error_code}
        return {"error": error.response?.data?.detail}
      }

  // return res.json()
}


const ProjectListLoader = async () => {
  return {projectLoad: await getProjectList()}
}




export { ProjectPageView, ProjectListLoader }
