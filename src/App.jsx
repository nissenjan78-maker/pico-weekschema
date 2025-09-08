// App.jsx
import WeekschemaApp from "./WeekschemaApp";
import { useDeviceBinding } from "../src/lib/useDeviceBinding"; // jouw module

export default function App() {
  const { boundUser } = useDeviceBinding(); 
  // boundUser bv: { id: "u_papa", role: "ouder" } of { id: "u_leon", role: "kind" }

  return <WeekschemaApp boundUser={boundUser} />;
}
