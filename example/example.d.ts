/// <reference path="../dist/typestate.d.ts" />
/// <reference path="knockout.d.ts" />
declare class Elevator {
    DoorsOpened: {
        a: number;
    };
    DoorsClosed: {
        b: number;
    };
    Moving: string;
}
declare var fsm: typestate.FiniteStateMachine<Elevator>;
declare var handsInDoor: boolean;
declare class ViewModel {
    constructor();
    HandsInDoor: KnockoutObservable<boolean>;
    CurrentState: KnockoutObservable<keyof Elevator>;
    Move(): void;
    Open(): void;
    Close(): void;
    CanMove: KnockoutComputed<boolean>;
    CanOpen: KnockoutComputed<boolean>;
    CanClose: KnockoutComputed<boolean>;
}
declare var vm: ViewModel;
