/// <reference path="../dist/typestate.d.ts" />
/// <reference path="knockout.d.ts" />

// Let's model the states of an elevator

// Define an Enum with all possible valid states
class Elevator {
   DoorsOpened = {a:1};
   DoorsClosed = {b: 3};
   Moving = "Henlo"
}

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
fsm.onEnter("DoorsClosed", ()=>{
   if(handsInDoor){
      return false;
   }
   return true;
});


class ViewModel {
   constructor() { }
   public HandsInDoor: KnockoutObservable<boolean> = ko.observable<boolean>()
   public CurrentState: KnockoutObservable<keyof Elevator> = ko.observable<keyof Elevator>(fsm.currentState)
 
   public Move() {
      fsm.go("Moving");
      this.CurrentState(fsm.currentState);
   }

   public Open() {
      fsm.go("DoorsOpened");
      this.CurrentState(fsm.currentState);
   }

   public Close() {
      fsm.go("DoorsClosed");
      this.CurrentState(fsm.currentState);
   }


   public CanMove: KnockoutComputed<boolean> = ko.computed<boolean>(() => {
      this.CurrentState();
      return fsm.canGo("Moving");
   });

   public CanOpen: KnockoutComputed<boolean> = ko.computed<boolean>(() => {
      this.CurrentState();
      return fsm.canGo("DoorsOpened");
   });

   public CanClose: KnockoutComputed<boolean> = ko.computed<boolean>(() => {
      this.CurrentState();
      return fsm.canGo("DoorsClosed");
   });

}

var vm = new ViewModel();
vm.HandsInDoor.subscribe((val) => {
   handsInDoor = val;
});
ko.applyBindings(vm);