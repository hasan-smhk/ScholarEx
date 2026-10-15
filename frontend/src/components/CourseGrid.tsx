import React, { useEffect, useState } from 'react';
import { getCourses } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CourseCard: React.FC<any> = ({ course }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition">
      <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
      <p className="text-sm text-gray-500 mt-2">{course.board} · {course.level}</p>
      <p className="text-sm text-gray-600 mt-3">{course.description?.slice(0, 120)}...</p>
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => navigate(`/courses/${course.id}`)} className="text-indigo-600 font-semibold">View</button>
        <button onClick={() => navigate(`/enroll/${course.id}`)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Enroll</button>
      </div>
    </div>
  );
};

const CourseGrid: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getCourses();
        setCourses(res.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold mb-6">Featured courses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(c => <CourseCard key={c.id} course={c} />)}
      </div>
    </div>
  );
};

export default CourseGrid;
