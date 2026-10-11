import { useEffect, useState } from 'react';
import { useWorkspace } from '../workspace';
import { ProblemManager } from '../components/ProblemManager';

export function CodingProblemsPage() {
    const { api } = useWorkspace();
    const [options, setOptions] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        api('/coding/manage/options').then(setOptions, failure => setError(failure.message));
    }, []);
    if (error) return <div className="alert" role="alert">{error}</div>;
    if (!options) return <div className="loading">Loading problem library...</div>;
    return <ProblemManager languages={options.languages} onChanged={() => {}}/>;
}
