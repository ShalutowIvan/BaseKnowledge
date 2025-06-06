import React from 'react';
import { useParams, Link, useNavigate, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from "axios"




function GroupsAll() {
	
	const setActive = ({isActive}) => isActive ? 'active-link' : '';	
	const [groups, setGroups] = useState([]);
	
	useEffect(() => {
		fetch(`http://127.0.0.1:8000/groups_all/`)
            .then(res => res.json())
            .then(data => setGroups(data));        
	}, [])

	
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


