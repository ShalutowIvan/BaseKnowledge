import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from "axios"
// import { API } from '../../apiAxios/apiAxios'
import { DeleteGroupModal } from './DeleteGroupModal'


function GroupsAll() {
	
	const setActive = ({isActive}) => isActive ? 'active-link' : '';	
	const [groups, setGroups] = useState([]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);


	const [modalOpen, setModalOpen] = useState(false);
	const [selectedGroup, setSelectedGroup] = useState(null);

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
			const response = await axios.get('http://127.0.0.1:8000/groups_all/');
			setGroups(response.data);
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
			<h3><NavLink to="/knowledges/" className={setActive}>Все группы</NavLink></h3>
			<ul>
            {
                groups?.map(group => (
                        <NavLink key={group.id} to={`/knowledges/${group.slug}`} className={setActive}>
                            <li>{group.name_group} 
                            	<button onClick={() => handleDeleteClick(group)}>
						              Удалить
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



export { GroupsAll }


