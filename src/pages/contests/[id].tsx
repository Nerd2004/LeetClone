import ProblemsTable from "@/components/ProblemsTable/ProblemsTable";
import Topbar from "@/components/Topbar/Topbar";
import { auth, firestore } from "@/firebase/firebase";
import useHasMounted from "@/hooks/useHasMounted";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BsCheckCircle } from "react-icons/bs";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { DBProblem, contests } from "@/utils/types/problem";
import Countdown from "@/components/Countdown/Countdown";

export default function Home() {
  const router = useRouter();
  const id: string = Array.isArray(router.query?.id)
    ? router.query.id[0]
    : router.query?.id || "";
  if (!id) {
    // Handle the case when id is not yet available (e.g., show loading spinner)
    return <div>Loading...</div>;
  }
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [starttime, setstarttime] = useState(0);
  const [endtime, setendtime] = useState(0);
  const hasMounted = useHasMounted();
  const problems = useGetProblems(
    setLoadingProblems,
    id,
    setstarttime,
    setendtime
  );
  const solvedProblems = useGetSolvedProblems();
  if (!hasMounted) return null;

  return (
    <>
      <main className="bg-dark-layer-2 min-h-screen">
        <Topbar />
        <h1
          className="text-2xl text-center text-gray-700 dark:text-gray-400 font-medium
					uppercase mt-10 mb-5"
        >
          {id}
        </h1>
        <div className="relative overflow-x-auto mx-auto px-6 pb-10">
          {loadingProblems && problems.length < 1 && (
            <div className="max-w-[1200px] mx-auto sm:w-7/12 w-full animate-pulse">
              {[...Array(10)].map((_, idx) => (
                <LoadingSkeleton key={idx} />
              ))}
            </div>
          )}
          {!loadingProblems && problems.length > 0 && (
            <div className="flex flex-col items-center justify-center">
              <p className="text-3xl text-gray-600 dark:text-gray-400 mb-4">
                Time Remaining:
              </p>
              <div className="text-6xl font-bold text-dark-green-s mb-8">
                <Countdown startTime={starttime} endTime={endtime} />
              </div>
            </div>
          )}
          <table className="text-sm text-left text-gray-500 dark:text-gray-400 sm:w-7/12 w-full max-w-[1200px] mx-auto">
            {!loadingProblems && problems.length > 0 && (
              <thead className="text-xs text-gray-700 uppercase dark:text-gray-400 border-b ">
                <tr>
                  <th scope="col" className="px-1 py-3 w-0 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 w-0 font-medium">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 w-0 font-medium">
                    Difficulty
                  </th>
                </tr>
              </thead>
            )}
            <tbody className="text-white">
              {problems.length > 0 ? (
                problems.map((problem, idx) => {
                  const difficulyColor =
                    problem.difficulty === "Easy"
                      ? "text-dark-green-s"
                      : problem.difficulty === "Medium"
                      ? "text-dark-yellow"
                      : "text-dark-pink";
                  return (
                    <tr
                      className={`${idx % 2 === 1 ? "bg-dark-layer-1" : ""}`}
                      key={problem.id}
                    >
                      <th className="px-2 py-4 font-medium whitespace-nowrap text-dark-green-s">
                        {solvedProblems.includes(problem.id) && (
                          <BsCheckCircle fontSize={"18"} width="18" />
                        )}
                      </th>
                      <td className="px-6 py-4">
                        {problem.link ? (
                          <Link
                            href={problem.link}
                            className="hover:text-blue-600 cursor-pointer"
                            target="_blank"
                          >
                            {problem.title}
                          </Link>
                        ) : (
                          <Link
                            className="hover:text-blue-600 cursor-pointer"
                            href={`/problems/${problem.id}`}
                          >
                            {problem.title}
                          </Link>
                        )}
                      </td>
                      <td className={`px-6 py-4 ${difficulyColor}`}>
                        {problem.difficulty}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center">
                    {/* No problems available. */}
                  </td>
                </tr>
              )}
              {!loadingProblems && problems.length < 1 && (
                <div className="flex flex-col items-center justify-center">
                  <p className="text-3xl text-gray-600 dark:text-gray-400 mb-4">
                    Contest has not yet started
                  </p>
                  <div className="text-6xl font-bold text-dark-green-s mb-8">
                    <Countdown startTime={starttime} endTime={endtime} />
                  </div>
                </div>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

const LoadingSkeleton = () => {
  return (
    <div className="flex items-center space-x-12 mt-4 px-6">
      <div className="w-6 h-6 shrink-0 rounded-full bg-dark-layer-1"></div>
      <div className="h-4 sm:w-52  w-32  rounded-full bg-dark-layer-1"></div>
      <div className="h-4 sm:w-52  w-32 rounded-full bg-dark-layer-1"></div>
      <div className="h-4 sm:w-52 w-32 rounded-full bg-dark-layer-1"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

function useGetProblems(
  setLoadingProblems: React.Dispatch<React.SetStateAction<boolean>>,
  id: string,
  setstartTime: React.Dispatch<React.SetStateAction<number>>,
  setendTime: React.Dispatch<React.SetStateAction<number>>
) {
  const [problems, setProblems] = useState<DBProblem[]>([]);

  useEffect(() => {
    const getProblems = async () => {
      // fetching data logic
      setLoadingProblems(true);
      const q1 = query(collection(firestore, "problems"));
      const querySnapshot1 = await getDocs(q1);
      const dbprob: DBProblem[] = [];
      const currentTime = Math.floor(new Date().getTime());

      const q2 = query(collection(firestore, "contests"));

      const querySnapshot2 = await getDocs(q2);

      // Loop through each document in the collection
      const con: contests[] = [];
      querySnapshot2.forEach((doc) => {
        const contestData = doc.data() as contests;

        // Check if the current time is past the end time of the contest
        if (contestData.id === id) {
          if (currentTime >= contestData.starttime) {
            con.push(contestData);
          }
          setstartTime(contestData.starttime);
          setendTime(contestData.endtime);
        }
      });
      if (con.length > 0) {
        const problist = con[0].problems;
        querySnapshot1.forEach((doc) => {
          // Check if the document ID is present in problist
          if (problist.includes(doc.id)) {
            dbprob.push({ id: doc.id, ...doc.data() } as DBProblem);
          }
        });

        setProblems(dbprob);
      }
      setLoadingProblems(false);
    };

    getProblems();
  }, [setLoadingProblems]);
  return problems;
}

function useGetSolvedProblems() {
  const [solvedProblems, setSolvedProblems] = useState<string[]>([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const getSolvedProblems = async () => {
      const userRef = doc(firestore, "users", user!.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        setSolvedProblems(userDoc.data().solvedProblems);
      }
    };

    if (user) getSolvedProblems();
    if (!user) setSolvedProblems([]);
  }, [user]);

  return solvedProblems;
}
