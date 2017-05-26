import { GameEvent } from "./../events/GameEvent";
import { PieceDisplay } from "./../game/displays/PieceDisplay";
import { GameManager } from "./../game/managers/GameManager";
import { LevelModel } from "./../game/models/LevelModel";
import { PieceData } from "./../game/models/PieceData";
import { Tile } from "./../game/models/Tile";
import { TouchPhase } from "./../game/models/TouchPhase";
import { AnimationUtils } from "./../game/utils/AnimationUtils";
import { GameService } from "./../services/GameService";
import { PieceDisplayPool } from "../game/utils/PieceDisplayPool";
import { GridFieldComponent } from "./../views/components/GridFieldComponent";

import { TweenLite, TimelineLite } from "gsap";
import { injectable, inject } from "robotlegs";
import { Mediator } from "robotlegs-pixi";

@injectable()
export class GridFieldComponentMediator extends Mediator<GridFieldComponent> {

    @inject(LevelModel)
    public levelModel: LevelModel;

    @inject(GameManager)
    public gameManager: GameManager;

    @inject(GameService)
    public gameService: GameService;

    private _displays: Map<PieceData, PieceDisplay>;

    public initialize(): void {
        this._displays = new Map<PieceData, PieceDisplay>();
        this.view.generateGrid(this.levelModel.maxCols, this.levelModel.maxRows);

        this.view.interactive = true;

        this.eventMap.mapListener(this.eventDispatcher, GameEvent.CLEAR_GRID, this.game_onClearGridHandler, this);
        this.eventMap.mapListener(this.eventDispatcher, GameEvent.UPDATE_GRID, this.game_onUpdateGridHandler, this);

        this.eventMap.mapListener(this.view, "mousedown", this.view_onSelectPiecesHandler, this);
        this.eventMap.mapListener(this.view, "mouseup", this.view_onSelectPiecesHandler, this);

        this.gameManager.nextStep();
    }

    public destroy(): void {
        this.eventMap.unmapListeners();
    }

    public updateDisplays(): void {
        if (this.levelModel.toRemove.length > 0) {
            this.removeDisplays();
        } else if (this.levelModel.toAdd.length > 0) {
            this.addDisplays();
        } else if (this.levelModel.toMove.length > 0) {
            this.moveDisplays();
        }
    }

    public addDisplays(): void {
        let piece: PieceData;
        while (this.levelModel.toAdd.length > 0) {
            piece = this.levelModel.toAdd.pop();
            if (this._displays.get(piece)) {
                continue;
            }

            piece.display = PieceDisplayPool.getPieceDisplay(piece.pieceId, piece.pieceType);
            piece.updateDisplayPosition();
            this.addDisplayToStage(piece);
        }
        this.gameManager.nextStep();
    }

    public removeDisplays(): void {
        let piece: PieceData;
        let animationList: Array<TweenLite> = [];

        while (this.levelModel.toRemove.length > 0) {
            piece = this.levelModel.toRemove.pop();

            this.levelModel.removePiece(piece);
            this._displays.delete(piece);

            animationList.push(AnimationUtils.createRemoveTween(piece));
        }
        AnimationUtils.applyAnimation(animationList, this.gameManager.nextStep);
    }

    public moveDisplays(): void {
        let animationList: Array<TweenLite> = [];

        while (this.levelModel.toMove.length > 0) {
            animationList.push(AnimationUtils.createMoveTween(this.levelModel.toMove.pop()));
        }
        AnimationUtils.applyAnimation(animationList, this.onComplete);
    }

    public onComplete = (ob: any = this) => {
        ob.gameManager.nextStep();
    }

    public addDisplayToStage(piece: PieceData): void {
        this.view.addChild(piece.display);
        this._displays.set(piece, piece.display);
    }

    public removeDisplayFromStage(piece: PieceData): void {
        piece.display.parent.removeChild(piece.display);
        this._displays.delete(piece);
    }
    private view_onSelectPiecesHandler(e: any): void {
        if (this.levelModel.toMove.length || this.levelModel.toRemove.length || this.levelModel.toAdd.length) {
            return;
        }

        if (e.type === TouchPhase.BEGAN || e.type === TouchPhase.ENDED) {
            let col;
            let row;
            let touchPhase = e.type;
            if (touchPhase === TouchPhase.BEGAN) {
                col = Math.floor((e.data.global.x - (this.view.x - Tile.TILE_WIDTH * .5)) / Tile.TILE_WIDTH);
                row = Math.floor((e.data.global.y - (this.view.y - Tile.TILE_HEIGHT * .5)) / Tile.TILE_HEIGHT);

                this.gameService.swapPiecesCommand(TouchPhase.BEGAN, col, row);

            } else if (touchPhase === TouchPhase.ENDED) {
                col = Math.floor((e.data.global.x - (this.view.x - Tile.TILE_WIDTH * .5)) / Tile.TILE_WIDTH);
                row = Math.floor((e.data.global.y - (this.view.y - Tile.TILE_HEIGHT * .5)) / Tile.TILE_HEIGHT);

                this.gameService.swapPiecesCommand(TouchPhase.ENDED, col, row);
            }
        }
    }

    private game_onClearGridHandler(e: any): void {
        let keys = this._displays.values();
        this._displays.forEach((display: PieceDisplay, piece: PieceData, map: Map<PieceData, PieceDisplay>) => {
            this.removeDisplayFromStage(piece);
        }, this);
    }

    private game_onUpdateGridHandler(e: any): void {
        this.updateDisplays();
    }
}