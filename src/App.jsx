import { useState } from 'react'
import Plateau from './Plateau'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Plateau/>
    </>
  )
}

export default App
