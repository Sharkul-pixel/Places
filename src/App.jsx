import { useRef, useState, useCallback, useEffect } from 'react';

import Places from './components/Places.jsx';
import Modal from './components/Modal.jsx';
import DeleteConfirmation from './components/DeleteConfirmation.jsx';
import logoImg from './assets/logo.png';
import AvailablePlaces from './components/AvailablePlaces.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';

//send updated places to the backend
async function updateUserPlaces(places) {
  const response = await fetch('http://localhost:3000/user-places', {
    method: 'PUT',
    body: JSON.stringify({ places }),
    headers: {
      'content-type': 'application/json' // informs the backend, data that's been sent with this request is json format
    }
  })
  const responseData = await response.json();

  if(!response.ok) {
    throw new Error('Failed to update user data.');
  }
  return console.log(responseData.message);
}

function App() {
  const selectedPlace = useRef();

  const [userPlaces, setUserPlaces] = useState([]);
  const [isFetching, setIsFetching] = useState(false); // common to use these 3 states together when fetching data
  const [error, setError] = useState(); 

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [errorUpdatingPlaces, setErrorUpdatingPlaces] = useState();

  useEffect(() => {
    async function fetchUserPlaces() {
      setIsFetching(true);
      try {
        let response = await fetch('http://localhost:3000/user-places');
        let responseData = await response.json();

        if(!response.ok) {
          throw new Error('Failed to fetch user places'); 
        }
        setUserPlaces(responseData.places);
      }catch(error){
        setError({message: 
          error.message || 'Could not fetch user places!'
        })
      }
      setIsFetching(false);
    }

    fetchUserPlaces();
  }, [])

  function handleStartRemovePlace(place) {
    setModalIsOpen(true);
    selectedPlace.current = place;
  }

  function handleStopRemovePlace() {
    setModalIsOpen(false);
  }

  async function handleSelectPlace(selectedPlace) {
    setUserPlaces((prevPickedPlaces) => {    // Optimistic updating --> Updating local state before sending request and waiting for the response
      if (!prevPickedPlaces) {
        prevPickedPlaces = [];
      }
      if (prevPickedPlaces.some((place) => place.id === selectedPlace.id)) { // ensures no duplicate places are listed
        return prevPickedPlaces;
      }
      return [selectedPlace, ...prevPickedPlaces];
    });
    
    try{
      await updateUserPlaces([selectedPlace, ...userPlaces]);
    }catch(error) {
      setUserPlaces(userPlaces); // reset to previous state
      setErrorUpdatingPlaces({
        message: error.message || 'Failed to update places.'
      })
    }
  };

  const handleRemovePlace = useCallback(async function handleRemovePlace() {
    setUserPlaces((prevPickedPlaces) =>
      prevPickedPlaces.filter((place) => place.id !== selectedPlace.current.id)
    );

    try {
      await updateUserPlaces(userPlaces.filter((place) => place.id !== selectedPlace.current.id));
    }catch(error) {
      setErrorUpdatingPlaces({message: 
        error.message || "Failed to delete place."
      })
    }

    setModalIsOpen(false);
  }, [userPlaces]);

  function handleError() {
    setErrorUpdatingPlaces(null);
  }

  return (
    <>
      <Modal open={errorUpdatingPlaces} onClose={handleError}>
        {errorUpdatingPlaces && <ErrorMessage // Application will break without condition because "errorUpdatingPlaces.message" is undefined without any errors
          title="An error has occurred!"
          message={errorUpdatingPlaces.message}
          onConfirm={handleError}
        />}
      </Modal>

      <Modal open={modalIsOpen} onClose={handleStopRemovePlace}>
        <DeleteConfirmation
          onCancel={handleStopRemovePlace}
          onConfirm={handleRemovePlace}
        />
      </Modal>

      <header>
        <img src={logoImg} alt="Stylized globe" />
        <h1>PlacePicker</h1>
        <p>
          Create your personal collection of places you would like to visit or
          you have visited.
        </p>
      </header>
      <main>
        {error && <ErrorMessage title="An Error Has Occurred!" message={error.message}/>}
        {!error && <Places
          title="I'd like to visit ..."
          fallbackText="Select the places you would like to visit below."
          isLoading={isFetching}
          loadingText="Fetching your places..."
          places={userPlaces}
          onSelectPlace={handleStartRemovePlace}
        />}

        <AvailablePlaces onSelectPlace={handleSelectPlace} />
      </main>
    </>
  );
}

export default App;
