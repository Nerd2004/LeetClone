import { problems } from './../problems/index';
export type Example = {
	id: number;
	inputText: string;
	outputText: string;
	explanation?: string;
	img?: string;
};
export type Standings = {
	user:string;
	time:number;
};
// local problem data
export type Problem = {
	id: string;
	title: string;
	problemStatement: string;
	examples: Example[];
	constraints: string;
	order: number;
	starterCode: string;
	handlerFunction: ((fn: any) => boolean) | string;
	starterFunctionName: string;
	textId: string;
};

export type DBProblem = {
	id: string;
	title: string;
	category: string;
	difficulty: string;
	likes: number;
	dislikes: number;
	order: number;
	videoId?: string;
	link?: string;
	textId: string;
	timestamp:number;
};

export type contests = {
	id: string;
	problems:string[];
	standings:string[];
	score:number[];
	count:number[];
	starttime:number;
	endtime:number;
};
