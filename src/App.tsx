import { api } from '@convex/_generated/api'
import { useQuery } from 'convex/react'

function App() {
  const tasks = useQuery(api.tasks.get)

  return (
    <div>{tasks?.map((task) => <div key={task._id}>{task.text}</div>)}</div>
  )
}

export default App
