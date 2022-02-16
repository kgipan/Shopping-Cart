// simulate getting products from DataBase
//const products = [
  //{ name: "Apples_:", country: "Italy", cost: 3, instock: 10 },
  //{ name: "Oranges:", country: "Spain", cost: 4, instock: 3 },
  //{ name: "Beans__:", country: "USA", cost: 2, instock: 5 },
  //{ name: "Cabbage:", country: "USA", cost: 1, instock: 8 },
//];
//=========Cart=============
const Cart = () => {
  const { Accordion } = ReactBootstrap;
  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });

  useEffect(() => {

    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);

        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = () => {
  const [items, setItems] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const {
    Card,
    Accordion,
    Button,
    Container,
    Row,
    Col,
    Image,
  } = ReactBootstrap;

  //  Fetch Data
  const { useState, useEffect } = React;
  const [query, setQuery] = useState("http://localhost:1337/api/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(
    "http://localhost:1337/api/products",
    {
      data: [],
    }
  ); 

  // Add item to cart and remove it from stock
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    setCart([...cart, ...item]);

    // Reduce stock
    let floorStock = [...items];
    floorStock.forEach(p => p.name === name ? p.instock-- : p.instock = p.instock);
    setItems([...floorStock]);

  };

  // Delete item from cart and add it back to stock
  const deleteCartItem = (index) => {
    let product = cart.filter((item,i) => index === i)[0];
    let floorStock = [...items];
    floorStock.forEach(p => p.name == product.name ? p.instock++ : p.instock += 0);
    setItems([...floorStock]);

    let newCart = cart.filter((item, i) => index != i);
    setCart(newCart);

  };
  const photos = ["apple.png", "orange.png", "beans.png", "cabbage.png", "nuts.png"];

  let list = items.map((item, index) => {
    
    if (item.instock > 0) {
      return (
        <li key={index} style={{display:"flex", margin: "10px 0px", alignItems:"left"}}>
            <Image src={photos[index % 5]} width={60} style={{flexGrow:0,flexShrink:0}}></Image>
            <div>
              <Button style={{margin: "5px", minWidth: "150px", maxHeight: "35px"}} variant="info" size="large" name={item.name} type="submit" onClick={addToCart}>
                {item.name} : ${item.cost}
              </Button>
              <div style={{margin: "0px 5px", textAlign: "center", fontSize: "0.9rem"}}>{item.instock} in stock</div>
            </div>

        </li>
      );
    }

  });

  let cartList = cart.map((item, index) => {
    return (
      <Card key={index}>
        <Card.Header id={"card-header-"+index}>
        <Accordion.Toggle as={Button} variant="link" eventKey={1 + index}>
            <b>{item.name}</b> (1)
          </Accordion.Toggle>
        </Card.Header>

        <Accordion.Collapse
          id={"card-body-"+index} eventKey={1 + index}
        >
          <Card.Body>
            <div style={{display:"flex", alignItems: "center"}}>
              <div style={{margin:"5px 10px 5px 5px"}}>$ {item.cost} {item.country}</div>
              <Button variant="danger" size="large" onClick={() => deleteCartItem(index)} style={{fontSize: "0.9em"}}>Remove from Cart</Button>
            </div>
          </Card.Body>
        </Accordion.Collapse>

        <Card.Body id={"card-body-"+index} style={{display: "none", fontSize:"0.9rem"}}>
          
          
        </Card.Body>
      </Card>
    );
  });

  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name} - 1
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    return newTotal;
  };

  const restockProducts = async (url) => {

    await doFetch(url);

    let floorStock = [...items];

    if (items.length === 0) {
      data.data.forEach(({ attributes: p }) => {
        const {name, country, cost, instock} = p;
        floorStock.push({ name, country, cost: Number(cost), instock: Number(instock) });
      });
    }
    else {
      data.data.forEach(({attributes: p}) => {
        let restockedItem = floorStock.filter(item => item.name == p.name)[0]; 
        restockedItem ? restockedItem.instock += p.instock : restockedItem.instock += 0;
      });
    }

    setItems(floorStock);

  };

  useEffect(() => {
    if (items.length === 0) {
      restockProducts("http://localhost:1337/api/products");
    }
  }, [items]);

  return (
    <Container>
      <Row>
        <Col style={{paddingBottom: "30px"}}>
          <h2 style={{padding:"15px 0px 5px 0px", color:"blue"}}>Groceries</h2>
          <ul style={{ listStyleType: "none", paddingLeft: "0px" }}>{list}</ul>
        </Col>
        <Col style={{paddingBottom: "30px"}}>
          <h2 style={{padding:"15px 0px 5px 0px", color:"blue"}}>In Your Cart</h2>
          <Accordion>{cartList}</Accordion>
        </Col>
        <Col style={{paddingBottom: "30px"}}>
          <h2 style={{padding:"15px 0px 5px 0px", color:"blue"}}>Check Out </h2>
          <Button variant="info" style={{minWidth:"200px"}} onClick={checkOut}>Total: $ {finalList().total}</Button>
          <div style={{margin:"5px 15px"}}>{finalList().total > 0  && finalList().final ? <><b>Cart:</b><br/></> : null }{finalList().total > 0 && finalList().final}{finalList().final.length > 1 && finalList().count} </div>
        </Col>
      </Row>
      <Row style={{border: "1px solid #ddd", padding: "20px"}}>
        <form
          style={{marginBottom: "0px"}}
          onSubmit={(event) => {
            event.preventDefault();
            restockProducts(`${query}`);
          }}
        >
          <input
            style={{margin:"5px",padding:"5px", width:"250px"}}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button style={{margin:"0px 10px"}} type="submit">{items.length === 0 ? 'Stock Products' : 'Restock Products'}</button>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));