import { GameEvent } from "./../../events/GameEvent";
import { TouchPhase } from "./../models/TouchPhase";
import { SwapModel } from "./../models/SwapModel";
import { GameManager } from "./../managers/GameManager";
import { injectable, inject, ICommand } from "@robotlegsjs/core";

@injectable()
export class SwapPiecesCommand implements ICommand {

    @inject(SwapModel)
    private swapModel: SwapModel;

    @inject(GameManager)
    private gameManager: GameManager;

    @inject(GameEvent)
    private gameEvent: GameEvent;

    public execute(): void {
        this.swapModel.status = SwapModel.WAIT;
        this.swapModel.setPosition(this.gameEvent.extra.phase, this.gameEvent.extra.col, this.gameEvent.extra.row);

        if (this.gameEvent.extra.phase === TouchPhase.ENDED) {
            this.swapModel.status = SwapModel.SWAP;
            this.gameManager.nextStep.bind(this)();
        }
    }
}
