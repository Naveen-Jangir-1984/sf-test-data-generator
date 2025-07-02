interface SalesforceObject {
  Id: string;
  [key: string]: any;
}

interface ViewingItem {
  [key: string]: any;
}

interface ViewProps {
  viewingItem: ViewingItem;
  setViewingItem: (item: SalesforceObject | null) => void;
}

const View: React.FC<ViewProps> = ({ viewingItem, setViewingItem }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        {Object.entries(viewingItem).map(([key, value]) => (
          <div key={key} className='attributes'>
            <strong>{key}</strong>
            {key === 'attributes' && typeof value === 'object' && value !== null ? (
              <div style={{ marginLeft: '10px' }}>
                {Object.entries(value).map(([subKey, subVal]) => (
                  <div key={subKey}>
                    <em>{subKey}</em>: {String(subVal)}
                  </div>
                ))}
              </div>
            ) : (
              <span> {String(value)}</span>
            )}
          </div>
        ))}
        <button onClick={() => setViewingItem(null)}>Close</button>
      </div>
    </div>
    )
};

export default View;