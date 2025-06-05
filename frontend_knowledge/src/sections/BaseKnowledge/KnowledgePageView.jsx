import { useParams, Link, useNavigate, useLoaderData, Await, useAsyncValue, NavLink } from 'react-router-dom'
import { React, Suspense, useState } from 'react';
import Cookies from "js-cookie";
// import { API } from "../../apiAxios/apiAxios"
import axios from "axios"
import { GroupsAll } from "./GroupsAll"

function KnowledgePageView() {
	const setActive = ({isActive}) => isActive ? 'active-link' : '';


	return (
		<>

		  <GroupsAll />
			<h1>База знаний</h1>
				<button><NavLink to="/group/create/" className={setActive}>Добавить группу</NavLink></button>
				&nbsp;&nbsp;&nbsp;
				<button><NavLink to="/knowledge/create/" className={setActive}>Добавить запись в базе знаний</NavLink></button>
				
								
		</>
		)
}







export { KnowledgePageView }
