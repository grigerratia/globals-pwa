const fs = require('fs');
let code = fs.readFileSync('src/firebase.js', 'utf-8');

const target = `    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }`;

const replacement = `    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    alert("Error obteniendo token Push: " + err.message);
    return null;
  }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/firebase.js', code);
  console.log("Added alert");
} else {
  console.log("Not found");
}
