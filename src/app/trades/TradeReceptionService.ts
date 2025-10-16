import { CreateTradeExecutionRequest } from "../../resources/generated/types";


export class TradeReceptionService {


    constructor() {}


    // takes a trade creation order and signature and stores in db
    // doesn't do any wallet calling, this is purely frontend
    // just takes the type data and the signature for storage
    async createTradeExecution(request: CreateTradeExecutionRequest) {
        const chain = request.chainType;
    }

}