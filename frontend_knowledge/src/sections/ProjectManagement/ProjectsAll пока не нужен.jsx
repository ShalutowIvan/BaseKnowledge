import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from "axios"
// import { API } from '../../apiAxios/apiAxios'
import { ProjectCreateModal } from './ProjectCreateModal'


function ProjectsAll() {
	
	const setActive = ({isActive}) => isActive ? 'active-link' : '';	
	const [projects, setProjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// модалка для создания проекта
	const [modalOpen, setModalOpen] = useState(false);

	const openModalClick = () => {	    
	    setModalOpen(true);
	  	};

	// const handleCreateSuccess = (data) => {
	//     // Обновляем список проектов после добавления		
	// 	// setProjects((prevProjects) => [...prevProjects, data]);
	// 	setProjects([...projects, data]);		
  	// 	};

	const handleCreateSuccess = (newProject) => {
		// Используем функциональную форму setProjects
		console.log("Новый проект", newProject)
		setProjects(prevProjects => [newProject, ...prevProjects]);
		setModalOpen(false);
		};


	useEffect(() => {
		const fetchData = async () => {
		try {
			const response = await axios.get('http://127.0.0.1:8000/project_all/');
			setProjects(response.data);
			setLoading(false);
		} catch (err) {
			setError(err);
			setLoading(false);
		}
		};

		fetchData();

	}, [])

	if (loading) {
    return <p>Загрузка...</p>;
  	}

	if (error) {
    return <p>Ошибка: {error.message}</p>;
  	}

	
	return (
		<>
			<aside>
			<h3>Список проектов</h3>

			<button onClick={openModalClick}>Создать проект</button>
			

            {
                projects?.map(project => (
                        <div className='project-section' key={project.id}>
							<NavLink to={`/projects/open/${project.id}`} className={setActive}>
								<h3>{project.title}</h3>
							</NavLink>
							<p>{project.description}</p>
							
						</div>
                    ))
            }
			

			{modalOpen && (
		        <ProjectCreateModal
		          
		          onClose={() => setModalOpen(false)}
		          onSuccess={handleCreateSuccess}
		        />
		      )}


			</aside>
		</>
		)

}


// в onSuccess в компоненте модалки надо передавать объект нового проекта. Типа onSuccess(Новый проект)


export { ProjectsAll }