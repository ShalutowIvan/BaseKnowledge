// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
// import './App.css'
import { RouterProvider } from 'react-router-dom'
import AppRouter from "./AppRouter"

function App() {
  

  return (
    <>
      <RouterProvider router={AppRouter} />
    </>
  )
}

export default App
