import { useParams, Link, useNavigate, useLoaderData, Await, useAsyncValue, NavLink } from 'react-router-dom'
import { React, Suspense, useState, useEffect } from 'react';
import Cookies from "js-cookie";
import { API } from "../../apiAxios/apiAxios"
import axios from "axios"
import { ProjectCreateModal } from './ProjectCreateModal'
import './CSS/cssProjects.css'

import { updateAccessTokenFromRefreshToken } from "../../regusers/AuthService"
import { ErrorDisplay } from './ErrorDisplay'

import { projectCache } from './cacheManager';


function ProjectPageView() {

  const test = () => {
    let number = 5;
    let pr = number.toString();
    const cachedData = projectCache.get(pr);
    console.log("это сейчас в кеше:", cachedData);
  }

	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {projectLoad} = useLoaderData()
	const [projects, setProjects] = useState([]);

  const navigate = useNavigate();  

	const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
	

  useEffect(() => {    
    if (projectLoad && !projectLoad.error) {
    const projectList = Array.isArray(projectLoad) ? projectLoad : [];
    setProjects(projectList);
    } else if (projectLoad.error) {
      setError(projectLoad.error)
    }
  }, [projectLoad]);

  const openModalClick = () => {      
      setModalOpen(true);
      };
  
  const handleCreateSuccess = (newProject) => {  
    if (newProject && newProject.id) {  
      console.log("Новый проект", newProject)
      setProjects(prevProjects => [newProject, ...prevProjects]);
      setModalOpen(false);
      } else {
        setError("Ошибка при создании проекта");
      }
    }

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

	return (
		<>       
      <ErrorDisplay 
          error={error} 
          onClose={() => setError(null)} 
        />  


			
			<div className='central-part'>
        <h1>Проекты</h1>
        <button onClick={test}>test</button>
        <button className="toolbar-button" onClick={openModalClick}>Создать проект</button>        
        <br/><br/>
              <div className="projects-grid">
                {
                    projects?.map(project => (                        
                            <div key={project.id} className='project-card'>
                              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                <h1 className="name-knowledge">{project.title}</h1>
                                <NavLink to={`/projects/open/${project.id}`} className={setActive}>
                                    <button className="toolbar-button">Открыть</button>
                                </NavLink>
                              </div>
                              <h2>Описание: {project.description}</h2>
                              
                            </div>                        
                        ))
                }
              </div>
        
        {projects.length === 0 && !loading && (
                        <div className="no-data">Нет данных для отображения</div>
                      )}
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
  try {
        const res = await API.get(`/project_all/`)        
        return res.data
      } catch (error) {
        return {"error": error.response?.data?.detail}
      }  
}


const ProjectListLoader = async () => {
  return {projectLoad: await getProjectList()}
}




export { ProjectPageView, ProjectListLoader }
