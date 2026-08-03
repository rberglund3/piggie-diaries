import { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import GuineaPigIcon from '../components/icons/GuineaPigIcon';
import './FoodSearch.css';
import { apiFetch } from '../api';

const FoodSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            apiFetch(`/food/search?q=${encodeURIComponent(query)}`)
                .then(res => res.ok ? res.json() : Promise.reject(new Error('Could not search foods')))
                .then(setResults)
                .catch(err => console.error('Error searching foods:', err));
        }, 250);

        return () => clearTimeout(timeout);
    }, [query]);

    return (
        <div className="food-search-page">
            <div className="food-search-intro">
                <GuineaPigIcon size={56} className="food-search-icon" />
                <div>
                    <h1>Is it safe to eat?</h1>
                    <p>Search a food to see if it's safe for guinea pigs and how much to give.</p>
                </div>
            </div>

            <div className="search-bar">
                <FiSearch className="search-bar-icon" />
                <input
                    type="text"
                    placeholder="e.g. carrot, chocolate, kale..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            <div className="food-results">
                {results.map(food => (
                    <div className={`food-card food-${food.safety}`} key={food._id}>
                        <div className="food-card-header">
                            <h3>{food.name}</h3>
                            <span className={`safety-badge safety-${food.safety}`}>{food.safety}</span>
                        </div>
                        {food.notes && <p>{food.notes}</p>}
                        {food.portion && <p className="food-portion">Portion: {food.portion}</p>}
                    </div>
                ))}
            </div>

            <p className="food-disclaimer">
                This list is a general guide, not veterinary advice. When in doubt, check with an exotics vet.
            </p>
        </div>
    );
};

export default FoodSearch;
