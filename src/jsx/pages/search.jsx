import Layout from "../layout/layout";
import {
  useDrawer
} from "../contexts/drawer/drawer.provider";
import PoapEvent from "../components/poapEvent";

const Search = () => {
  const { poapEvents } = useDrawer();
  return (
    <Layout activeMenu={2}>
      <div className="row">
        <div className="col-xxl-12 col-xl-12 col-lg-12 h-auto mh-100">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">Search</h4>
            </div>
          </div>
          <div className="card p-4">
            <table className="table table-striped table-small responsive-table">
              <tbody>
                {poapEvents.length === 0 ? (
                  <tr>
                    <td>No events found</td>
                  </tr>
                ) : (
                  poapEvents.map((event, index) => (
                    <PoapEvent event={event} index={index} key={index} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
