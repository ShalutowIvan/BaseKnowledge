import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from "axios"
// import { API } from '../../apiAxios/apiAxios'



function GroupsAll() {
	
	const setActive = ({isActive}) => isActive ? 'active-link' : '';	
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

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
			<h3><NavLink to="/knowledge/" className={setActive}>Все группы</NavLink></h3>

            {
                groups?.map(group => (
                        <NavLink key={group.id} to={`/knowledge/${group.slug}`} className={setActive}>
                            <li>{group.name_group}</li>
                        </NavLink>
                    ))
            }
			</aside>
		</>
		)

}



export { GroupsAll }


