import { useParams, Link, useNavigate, useLoaderData, Await, useAsyncValue, NavLink } from 'react-router-dom'
import { React, Suspense, useState, useEffect } from 'react';
import Cookies from "js-cookie";
import { API } from "../../apiAxios/apiAxios"
import axios from "axios"
import { RoadMapCreateModal } from './RoadMapCreateModal'

import { updateAccessTokenFromRefreshToken } from "../../regusers/AuthService"


function RoadMapList() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {roadmapLoad} = useLoaderData()
	const [roadmaps, setRoadmaps] = useState(roadmapLoad);
  

  const navigate = useNavigate();  

	const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);

    
	if (roadmapLoad?.error) {  
    return <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {roadmapLoad["error"]}. Пройдите авторизацию.</h1>
  	}


  const openModalClick = () => {      
      setModalOpen(true);
      };

  
  const handleCreateSuccess = (newRoadmap) => {
    // Используем функциональную форму setProjects
    console.log("Новая мапа", newRoadmap)
    setRoadmaps(prevRoadmap => [newRoadmap, ...prevRoadmap]);
    setModalOpen(false);
    };


	return (
		<>			
      
			
			<div className='central-part'>
        <h1>Дорожные карты</h1>
        <button className="toolbar-button" onClick={openModalClick}>Создать дорожную карту</button>
            
        
        <br/><br/>

        {
                  roadmaps?.map(roadmap => (
                        <>
                          <div className='project-section'>
                          <h1 className="name-knowledge">{roadmap.title}</h1>
                          <h2>Описание: {roadmap.description}</h2>
                          <NavLink key={roadmap.id} to={`/roadmaps/open/${roadmap.id}`} className={setActive}>
                              <button className="toolbar-button">Открыть</button>
                          </NavLink>                              
                          </div>
                          <br/>
                        </>
                      ))
              }
      </div>


      {modalOpen && (
		        <RoadMapCreateModal		          
		          onClose={() => setModalOpen(false)}
		          onSuccess={handleCreateSuccess}
		        />
		      )}
      
            		      
      								
		</>
		)
}


async function getRoadMapList() { 
  

  try {
        const res = await API.get(`http://127.0.0.1:8000/roadmaps_all/`)
        console.log(res)
        return res.data
      } catch (error) {
       
        console.log("Ошибка из detail:", error.response?.data?.detail)
        // console.log("Статус ответа:", error.response?.status)       

        
        // return {"error": error.response?.data?.detail.error_code}
        return {"error": error.response?.data?.detail}
      }
  
}


const RoadMapListLoader = async () => {
  return {roadmapLoad: await getRoadMapList()}
}




export { RoadMapList, RoadMapListLoader }
