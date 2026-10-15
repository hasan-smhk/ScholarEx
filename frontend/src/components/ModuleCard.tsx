import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  description: string;
  path: string;
}

const ModuleCard = ({ title, description, path }: Props) => {
  const navigate = useNavigate();
  return (
    <div className="module-card" onClick={() => navigate(path)}>
      <h3>{title}</h3>
      <p>{description}</p>
      <button className="explore-btn">Explore</button>
    </div>
  );
};
export default ModuleCard;
