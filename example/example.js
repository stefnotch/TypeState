/// <reference path="../dist/typestate.d.ts" />
/// <reference path="knockout.d.ts" />
// Let's model the states of an elevator
// Define an Enum with all possible valid states
var Elevator = /** @class */ (function () {
    function Elevator() {
        this.DoorsOpened = { a: 1 };
        this.DoorsClosed = { b: 3 };
        this.Moving = "Henlo";
    }
    return Elevator;
}());
// Construct the FSM with the inital state, in this case the elevator starts with its doors opened
var fsm = new typestate.FiniteStateMachine(new Elevator(), "DoorsClosed");
// Declare the valid state transitions to model your system
// Doors can go from opened to closed, and vice versa
fsm.from("DoorsOpened").to("DoorsClosed");
fsm.from("DoorsClosed").to("DoorsOpened");
// Once the doors are closed the elevator may move
fsm.from("DoorsClosed").to("Moving");
// When the elevator reaches its destination, it may stop moving
fsm.from("Moving").to("DoorsClosed");
var handsInDoor = false;
// Listen for transitions to DoorsClosed, if the callback returns false the transition is canceled.
fsm.onEnter("DoorsClosed", function () {
    if (handsInDoor) {
        return false;
    }
    return true;
});
var ViewModel = /** @class */ (function () {
    function ViewModel() {
        var _this = this;
        this.HandsInDoor = ko.observable();
        this.CurrentState = ko.observable(fsm.currentState);
        this.CanMove = ko.computed(function () {
            _this.CurrentState();
            return fsm.canGo("Moving");
        });
        this.CanOpen = ko.computed(function () {
            _this.CurrentState();
            return fsm.canGo("DoorsOpened");
        });
        this.CanClose = ko.computed(function () {
            _this.CurrentState();
            return fsm.canGo("DoorsClosed");
        });
    }
    ViewModel.prototype.Move = function () {
        fsm.go("Moving");
        this.CurrentState(fsm.currentState);
    };
    ViewModel.prototype.Open = function () {
        fsm.go("DoorsOpened");
        this.CurrentState(fsm.currentState);
    };
    ViewModel.prototype.Close = function () {
        fsm.go("DoorsClosed");
        this.CurrentState(fsm.currentState);
    };
    return ViewModel;
}());
var vm = new ViewModel();
vm.HandsInDoor.subscribe(function (val) {
    handsInDoor = val;
});
ko.applyBindings(vm);
//# sourceMappingURL=example.js.map