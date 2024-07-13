const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

// Middleware to handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Bad JSON');
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

let rooms = [];
let bookings = [];
let customers = [];

// Helper function to check if a room is available
function isRoomAvailable(roomId, date, startTime, endTime) {
  return !bookings.some(booking => 
    booking.roomId === roomId && 
    booking.date === date && 
    ((startTime >= booking.startTime && startTime < booking.endTime) ||
    (endTime > booking.startTime && endTime <= booking.endTime))
  );
}

// Create a Room
app.post('/rooms', (req, res) => {
  const { numberOfSeats, amenities, pricePerHour } = req.body;
  const roomId = rooms.length + 1;
  const room = { roomId, numberOfSeats, amenities, pricePerHour };
  rooms.push(room);
  res.status(201).json(room);
});

// Book a Room
app.post('/bookings', (req, res) => {
  const { customerName, date, startTime, endTime, roomId } = req.body;

  if (!isRoomAvailable(roomId, date, startTime, endTime)) {
    return res.status(400).json({ message: 'Room is already booked for the given time.' });
  }

  const bookingId = bookings.length + 1;
  const booking = { bookingId, customerName, date, startTime, endTime, roomId };
  bookings.push(booking);

  // Add customer if not exists
  if (!customers.some(customer => customer.name === customerName)) {
    customers.push({ name: customerName });
  }

  console.log(`Booking added: ${JSON.stringify(booking)}`);
  res.status(201).json(booking);
});

// List all Rooms with Booked Data
app.get('/rooms/booked', (req, res) => {
  const result = rooms.map(room => {
    const roomBookings = bookings.filter(booking => booking.roomId === room.roomId);
    return { ...room, bookings: roomBookings };
  });
  res.json(result);
});

// List all customers with booked Data
app.get('/customers/booked', (req, res) => {
  const result = customers.map(customer => {
    const customerBookings = bookings.filter(booking => booking.customerName === customer.name);
    return { ...customer, bookings: customerBookings };
  });
  res.json(result);
});

// List how many times a customer has booked the room with below details
app.get('/customers/:name/bookings', (req, res) => {
  const customerName = decodeURIComponent(req.params.name).toLowerCase();
  console.log(`Fetching bookings for customer: ${customerName}`);

  const customerBookings = bookings.filter(booking => booking.customerName.toLowerCase() === customerName);
  console.log(`Found bookings: ${JSON.stringify(customerBookings)}`);

  res.json(customerBookings);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
