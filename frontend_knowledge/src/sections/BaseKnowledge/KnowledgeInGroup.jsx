import React from 'react';
import { useParams, Link, useNavigate, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from "axios"
import { GroupsAll } from "./GroupsAll"
// import { API } from "../apiAxios/apiAxios"

function KnowledgeInGroup() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';
	const {slug} = useParams();
	const [knowledges, setKnowledges] = useState([]);
	// const navigate = useNavigate();


	useEffect(() => {
		fetch(`http://127.0.0.1:8000/knowledges_in_group/${slug}`)
			.then(res => res.json())
			.then(data => setKnowledges(data))

	}, [slug])

	return (
		<>	
		<aside>
		<GroupsAll />
		</aside>

		<div className="list-knowledge">
            {
                	knowledges?.map(knowledge => (
                				<>
                				<h1 className="name-knowledge">{knowledge.title}</h1>
		                        <h2>Описание: {knowledge.description}</h2>
		                        <NavLink key={knowledge.id} to={`/knowledge/open/${knowledge.slug}`} className={setActive}>
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



export { KnowledgeInGroup }


