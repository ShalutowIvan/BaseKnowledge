import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { API } from "../../apiAxios/apiAxios"
import { useParams, Link, useNavigate, useLoaderData, Await, redirect, useRevalidator } from 'react-router-dom'
// import { GroupsAll } from "./GroupsAll"
// import MDEditor from '@uiw/react-markdown-editor';//это посоветовал дипсик
import MDEditor from '@uiw/react-md-editor';//это посоветовал чатгпт
// import MDEditor from 'mdeditor';//это по совету гугла

import 'highlight.js/styles/atom-one-dark.css'; // стили подсветки (можно выбрать любой другой)

import { markdownPlugins, markdownComponents } from './MDutils/UtilsImageMD';
import { TextStyleToolbar } from './MDutils/TextStyleToolbar';


function KnowledgeOpenFree() {
    

  const { knowledgeLoad } = useLoaderData();//лоадер знания
    
  if (knowledgeLoad?.error) {
    return (<h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {knowledgeLoad?.error}</h1>)
  }

  const [knowledge, setKnowledge] = useState(knowledgeLoad);
    
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  
      
  return (
    <>
      
      
      <div className="post-container-free section-frame">
        
        {/*это шапка знания*/}        
          <>
          <p>Группа: {knowledge.group.name_group}</p>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Название:</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата создания: {knowledge.created_at}</span>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{knowledge.title}</span>
            <span style={{ fontSize: '18px', color: '#5F9EA0' }}>Дата изменения: {knowledge.updated_at}</span>
          </div>
          <br/>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{ fontSize: '24px', color: '#5F9EA0', fontWeight: 'bold' }}>Описание:</span>            
              
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>            
            <span style={{ fontSize: '20px', color: '#E0FFFF' }}>{knowledge.description}</span>
                        
          </div>
          </>        

      </div>
    
    
    {/*ниже контент знания*/}
    <div className="post-container-free">
      <h1>Содержание знания</h1>
     
        
        
        <div className="view-mode">         
          <div className="markdown-content" data-color-mode="light">
              <ReactMarkdown
                remarkPlugins={markdownPlugins.remark}
                rehypePlugins={markdownPlugins.rehype}
                components={markdownComponents}
                >
                {knowledge.content}
              </ReactMarkdown>
            </div>
            <br/>
                      

        </div>
      
      {error && <div className="error-message">{error}</div>}
    </div>
                    
                    
    </>
    )
}


async function getKnowledgeOpenFree(slug) {  

  try {
        const res = await axios.get(`http://127.0.0.1:8000/knowledges_open_free/${slug}`);
        // console.log(res)
        return res.data
      } catch (error) {
       
        console.log("Ошибка из detail:", error.response?.data?.detail)
                
        return {"error": error.response?.data?.detail}
      }
 
}


const KnowledgeOpenFreeLoader = async ({params}) => {
  
  const slug = params.slug_kn//после params писать название параметра которое прописали в файле AppRouter.jsx с урлками
  
  return {knowledgeLoad: await getKnowledgeOpenFree(slug)}
}



export { KnowledgeOpenFree, KnowledgeOpenFreeLoader };