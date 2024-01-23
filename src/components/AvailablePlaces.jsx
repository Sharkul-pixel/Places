import { useState, useEffect } from 'react';
import Places from './Places.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import { sortPlacesByDistance } from '../loc.js'

export default function AvailablePlaces({ onSelectPlace }) {
  const [availablePlaces, setAvailablePlaces] = useState([]); // common to use these 3 states together when fetching data
  const [isFetching, setIsFetching] = useState(false); // common to use these 3 states together when fetching data
  const [error, setError] = useState();  // common to use these 3 states together when fetching data

  useEffect(() => {
    async function fetchAvailablePlaces() {
      setIsFetching(true);
      try {
        let response = await fetch('http://localhost:3000/places');
        let responseData = await response.json();

        if(!response.ok) {
          throw new Error('Failed to fetch places'); // allows the code to jump to the catch block where error handling can take place
        }
        navigator.geolocation.getCurrentPosition((position) => {
          const sortedPlaces = sortPlacesByDistance(
            responseData.places,
            position.coords.latitude,
            position.coords.longitude
          )
          setAvailablePlaces(sortedPlaces);
          setIsFetching(false);
        })
      }catch(error) {
        setError({
          message:
            error.message || 'Could not fetch places!' // if error.message is undefined then fallback to custom message
        });
        setIsLoading(false);
      } 
    }
    
    fetchAvailablePlaces();
  }, []);
  // console.log('fetch', AvailablePlaces)

  if(error) {
    return <ErrorMessage title="An error has occurred!" message={error.message} />
  }

  return (
    <Places
      title="Available Places"
      places={availablePlaces}
      fallbackText="No places available."
      isLoading={isFetching}
      loadingText="Fetching place data..."
      onSelectPlace={onSelectPlace}
    />
  );
}
