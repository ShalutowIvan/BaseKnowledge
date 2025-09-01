import { NavLink, useLoaderData, useNavigate, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from "axios"
import { API } from '../../apiAxios/apiAxios'
import { DeleteGroupModal } from './DeleteGroupModal'
import { FaTrash } from "react-icons/fa";



function GroupsAll() {
	
	const setActive = ({isActive}) => isActive ? 'active-link' : '';	
	const [groups, setGroups] = useState([]);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);


	const [modalOpen, setModalOpen] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState(null);

	const navigate = useNavigate();
	const location = useLocation();

	//передаем объект группы в компонент модального окна. 
	const handleDeleteClick = (group) => {
	    setSelectedGroup(group);	    
	    setModalOpen(true);
	  	};


	const handleDeleteSuccess = () => {
	    // Обновляем список групп после удаления
	    setGroups(groups.filter(g => g.id !== selectedGroup.id));
  		};

	
	useEffect(() => {
		const fetchData = async () => {
		try {
			const response = await API.get('/groups_all/');
			setGroups(response.data);
			setLoading(false);
		} catch (err) {
			setError(err);
			setLoading(false);
		}
		};

		// Проверяем флаг из навигации или при первом рендере. Это нужно чтобы после добавления группа добавлялась сразу
		  if (!location.state?.needsRefresh) {
		    fetchData();
		  } else {
		    // Если был флаг, обновляем и удаляем его
		    fetchData();
		    navigate(location.pathname, { replace: true, state: {} });
		  }

	}, [location.state?.needsRefresh, navigate, location.pathname])

	

	
	
	
	return (
		<>
			<aside>
			<h3><NavLink to="/knowledges/" className={setActive}>Все группы</NavLink></h3>
			<ul>
            {
                groups?.map(group => (
                        <NavLink key={group.id} to={`/knowledges/${group.slug}`} className={setActive}>
                            <li>{group.name_group} 
							<button onClick={() => handleDeleteClick(group)} className="delete-btn">
						             <FaTrash className="trash-icon" size={15} />
						            </button>	
                            	
						    </li>
							
						    <br/>
                        </NavLink>

                    ))
            }
            </ul>

            {modalOpen && (
		        <DeleteGroupModal
		          groupToDelete={selectedGroup}
		          onClose={() => setModalOpen(false)}
		          onSuccess={handleDeleteSuccess}
		        />
		      )}

            {/*<h1>{selectedGroup?.id}</h1>*/}

			</aside>
		</>
		)

}


// async function getGroupsList() { 
//   const res = await fetch("http://127.0.0.1:8000/groups_all/")

//   // try {
//   //       const res = await API.get(`/api/checkout_list/orders/${id}`)     
//   //  return res.data
//   //     } catch (error) {
//   //      //если ошибка, то выдаем ошибку
//   //       console.error("Error here: ", error);
//   //       // setError("Failed to fetch user data. Please try again.");
//   //       return "error"
//   //     }

//   return res.json()
// }


// const GroupsListLoader = async () => {  
//   return {groupsLoad: await getGroupsList()}
// }


export { GroupsAll }


