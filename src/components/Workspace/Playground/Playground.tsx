import { useState, useEffect } from "react";
import PreferenceNav from "./PreferenceNav/PreferenceNav";
import Split from "react-split";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import EditorFooter from "./EditorFooter";
import { Problem, contests } from "@/utils/types/problem";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/firebase/firebase";
import { toast } from "react-toastify";
import { problems } from "@/utils/problems";
import { useRouter } from "next/router";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
} from "firebase/firestore";
import firebase from "firebase/app";
import "firebase/firestore";
import { FieldValue } from "firebase/firestore";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ppid } from "process";

type PlaygroundProps = {
  problem: Problem;
  setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setSolved: React.Dispatch<React.SetStateAction<boolean>>;
};

export interface ISettings {
  fontSize: string;
  settingsModalIsOpen: boolean;
  dropdownIsOpen: boolean;
}

const Playground: React.FC<PlaygroundProps> = ({
  problem,
  setSuccess,
  setSolved,
}) => {
  const [activeTestCaseId, setActiveTestCaseId] = useState<number>(0);
  let [userCode, setUserCode] = useState<string>(problem.starterCode);

  const [fontSize, setFontSize] = useLocalStorage("lcc-fontSize", "16px");

  const [settings, setSettings] = useState<ISettings>({
    fontSize: fontSize,
    settingsModalIsOpen: false,
    dropdownIsOpen: false,
  });

  const [user] = useAuthState(auth);
  const {
    query: { pid },
  } = useRouter();

  const [contest, setcontest] = useState<contests[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<string[]>([]);
  const [Submitting, setSubmitting] = useState(false);
  const fetchContestData = async () => {
    // Get current time in milliseconds
    const currentTime = Math.floor(new Date().getTime());
    // Query the contests collection
    const q = query(collection(firestore, "contests"));
    const querySnapshot = await getDocs(q);
    // Loop through each document in the collection
    const tmp: contests[] = [];
    querySnapshot.forEach((doc) => {
      const contestData = doc.data() as contests;
      // Check if the current time is past the end time of the contest
      if (currentTime < contestData.endtime) {
        if (contestData.problems && contestData.problems.includes(problem.id)) {
          tmp.push(contestData);
          setcontest(tmp);
        }
      }
    });
  };
  const getSolvedProblems = async () => {
    const userRef = doc(firestore, "users", user!.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      setSolvedProblems(userDoc.data().solvedProblems);
    }
  };

  useEffect(() => {
    const fetchContestData = async () => {
      // Get current time in milliseconds
      const currentTime = Math.floor(new Date().getTime());
      // Query the contests collection
      const q = query(collection(firestore, "contests"));
      const querySnapshot = await getDocs(q);
      // Loop through each document in the collection
      const tmp: contests[] = [];
      querySnapshot.forEach((doc) => {
        const contestData = doc.data() as contests;
        // Check if the current time is past the end time of the contest
        if (currentTime < contestData.endtime) {
          if (
            contestData.problems &&
            contestData.problems.includes(problem.id)
          ) {
            tmp.push(contestData);
          }
        }
      });
      setcontest(tmp);
    };

    const getSolvedProblems = async () => {
      if (user) {
        const userRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          setSolvedProblems(userDoc.data().solvedProblems || []);
        }
      }
    };

    fetchContestData();
    getSolvedProblems();
  }, [user, problem]);

  const handleSubmit = async () => {
    setSubmitting(true);

    if (!user) {
      toast.error("Please login to submit your code", {
        position: "top-center",
        autoClose: 3000,
        theme: "dark",
      });
      return;
    }
    try {
      userCode = userCode.slice(userCode.indexOf(problem.starterFunctionName));
      const cb = new Function(`return ${userCode}`)();
      const handler = problems[pid as string].handlerFunction;

      if (typeof handler === "function") {
        const success = handler(cb);

        if (success) {
          if (contest.length > 0) {
            const userRef = doc(firestore, "users", user.uid);
            const userDoc = await getDoc(userRef);
            const contestRef = doc(firestore, "contests", contest[0].id);
            const docx = await getDoc(contestRef);
            const contestData = docx.data();
            if (contestData) {
              const standings = contestData.standings || [];
              const index = standings.findIndex(
                (entry: any) => entry === user.email
              );
              const currentTime = Math.floor(new Date().getTime());
              if (index !== -1) {
                if (!solvedProblems.includes(problem.id)) {
                  // If user email exists in standings, update count and score at the found index
                  const count = contestData.count || [];
                  const score = contestData.score || [];

                  score[index] += currentTime - contestData.starttime; // Update count at specific index
                  count[index] += 1; // Update score at specific index

                  await updateDoc(contestRef, {
                    count: count,
                    score: score,
                  });
                }
              } else {
                const count = contestData.count || [];
                const score = contestData.score || [];
                const standings = contestData.standings || [];

                const email = user?.email;

                await updateDoc(contestRef, {
                  count: [...count, 1],
                  score: [...score, currentTime - contestData.starttime],
                  standings: [...standings, user.email],
                });
              }
            }
          }

          const userRef = doc(firestore, "users", user.uid);

          await updateDoc(userRef, {
            solvedProblems: arrayUnion(pid),
          });

          await fetchContestData();
          await getSolvedProblems();
          setSolved(true);

          toast.success("Congrats! All tests passed!", {
            position: "top-center",
            autoClose: 3000,
            theme: "dark",
          });
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
          }, 4000);
        }
      }
    } catch (error: any) {
      console.log(error.message);
      if (
        error.message.startsWith(
          "AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:"
        )
      ) {
        toast.error("Oops! One or more test cases failed", {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
      } else {
        toast.error(error.message, {
          position: "top-center",
          autoClose: 3000,
          theme: "dark",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const code = localStorage.getItem(`code-${pid}`);
    if (user) {
      setUserCode(code ? JSON.parse(code) : problem.starterCode);
    } else {
      setUserCode(problem.starterCode);
    }
  }, [pid, user, problem.starterCode]);

  const onChange = (value: string) => {
    setUserCode(value);
    localStorage.setItem(`code-${pid}`, JSON.stringify(value));
  };

  return (
    <div className="flex flex-col bg-dark-layer-1 relative overflow-x-hidden">
      <PreferenceNav settings={settings} setSettings={setSettings} />

      <Split
        className="h-[calc(100vh-94px)]"
        direction="vertical"
        sizes={[60, 40]}
        minSize={60}
      >
        <div className="w-full overflow-auto">
          <CodeMirror
            value={userCode}
            theme={vscodeDark}
            onChange={onChange}
            extensions={[javascript()]}
            style={{ fontSize: settings.fontSize }}
          />
        </div>
        <div className="w-full px-5 overflow-auto">
          {/* testcase heading */}
          <div className="flex h-10 items-center space-x-6">
            <div className="relative flex h-full flex-col justify-center cursor-pointer">
              <div className="text-sm font-medium leading-5 text-white">
                Testcases
              </div>
              <hr className="absolute bottom-0 h-0.5 w-full rounded-full border-none bg-white" />
            </div>
          </div>

          <div className="flex">
            {problem.examples.map((example, index) => (
              <div
                className="mr-2 items-start mt-2 "
                key={example.id}
                onClick={() => setActiveTestCaseId(index)}
              >
                <div className="flex flex-wrap items-center gap-y-4">
                  <div
                    className={`font-medium items-center transition-all focus:outline-none inline-flex bg-dark-fill-3 hover:bg-dark-fill-2 relative rounded-lg px-4 py-1 cursor-pointer whitespace-nowrap
										${activeTestCaseId === index ? "text-white" : "text-gray-500"}
									`}
                  >
                    Case {index + 1}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="font-semibold my-4">
            <p className="text-sm font-medium mt-4 text-white">Input:</p>
            <div className="w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2">
              {problem.examples[activeTestCaseId].inputText}
            </div>
            <p className="text-sm font-medium mt-4 text-white">Output:</p>
            <div className="w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2">
              {problem.examples[activeTestCaseId].outputText}
            </div>
          </div>
        </div>
      </Split>
      <EditorFooter handleSubmit={handleSubmit} Submitting={Submitting} />
    </div>
  );
};
export default Playground;

function GetCurrentContests(id: string) {
  const [contestva, setcontestva] = useState<contests[]>([]);

  useEffect(() => {
    const fetchContestData = async () => {
      // Get current time in milliseconds
      const currentTime = Math.floor(new Date().getTime());
      // Query the contests collection
      const q = query(collection(firestore, "contests"));
      const querySnapshot = await getDocs(q);
      // Loop through each document in the collection
      const tmp: contests[] = [];
      querySnapshot.forEach((doc) => {
        const contestData = doc.data() as contests;
        // Check if the current time is past the end time of the contest
        if (currentTime < contestData.endtime) {
          if (contestData.problems && contestData.problems.includes(id)) {
            tmp.push(contestData);
            setcontestva(tmp);
          }
        }
      });
    };

    fetchContestData();
  }, []); // Empty dependency array to run once when component mounts

  return contestva;
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
