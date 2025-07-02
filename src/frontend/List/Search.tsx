interface SearchProps {
  type: string;
  searchText: string;
  setSearchText: (text: string) => void;
}

const Search: React.FC<SearchProps> = ({ type, searchText, setSearchText }) => {
  return (
    <input
      type="text"
      placeholder={`Search ${type}...`}
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
    />
  )
};

export default Search;