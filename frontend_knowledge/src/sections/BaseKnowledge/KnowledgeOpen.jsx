import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { useParams, Link, useNavigate, useLoaderData, Await } from 'react-router-dom'
import { GroupsAll } from "./GroupsAll"


function KnowledgeOpen() {
    // const [title, setTitle] = useState("");
    // const [description, setDescription] = useState("");
    // const [content, setContent] = useState("");    
    // const [created_at, setCreated_at] = useState("");    
    // const [updated_at, setUpdated_at] = useState("");    
    // const [free_access, setFree_access] = useState(false);    
    // const [group_id, setGroup_id] = useState(null);    
    // const [images, setImages] = useState("");
    // const {knowledgeLoad} = useLoaderData();


    const {slug} = useParams();
    const [knowledge, setKnowledge] = useState("");
    // console.log(knowledge)
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    


    
    useEffect(() => {
    fetch(`http://127.0.0.1:8000/knowledges_open/${slug}`)
      .then(res => res.json())
      .then(data => setKnowledge(data))
      .catch((error) => {
          console.error('Error fetching state receipt:', error);
            });
    }, [])
  
  const navigate = useNavigate();

  const goBack = () => {
    return navigate(-1);
  }

    
  return (
    <>
      <GroupsAll />

      <h1>Содержание знания</h1>
        <button onClick={goBack}>Назад</button>

        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        

          <h2>Название знания: {knowledge.title}</h2>  
          <h2>Дата создания: {knowledge.created_at}</h2>  
          <h2>Описание: {knowledge.description}</h2>  
          <h2>Содержание: {knowledge.content}</h2>  
          <h2>Свободный доступ: 
          {!knowledge.free_access && <> Не разрешен</>}
          {knowledge.free_access && <> Разрешен</>}
          </h2>  

                    
                    
    </>
    )
}






async function getKnowledgeOpen(slug) { 
  const res = await fetch(`http://127.0.0.1:8000/knowledges_open/${slug}`)//тут берутся все элементы с одним и тем же номером документа

  // try {
  //       const res = await API.get(`/api/checkout_list/orders/${id}`)     
  //  return res.data
  //     } catch (error) {
  //      //если ошибка, то выдаем ошибку
  //       console.error("Error here: ", error);
  //       // setError("Failed to fetch user data. Please try again.");
  //       return "error"
  //     }


  return res.json()
}


const KnowledgeOpenLoader = async ({params}) => {
  
  const slug = params.slug//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
  return {knowledge: await getKnowledgeOpen(slug)}
}







export { KnowledgeOpen, KnowledgeOpenLoader };