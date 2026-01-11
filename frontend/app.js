/*async function submitIssue() {
    const issue = document.getElementById("issue").value;
    const context = document.getElementById("context").value;
   
    const res = await fetch("http://localhost:3000/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issue, context })
    });
   
    const data = await res.json();
    document.getElementById("response").textContent = data.reply;
  }*/
    document.getElementById("run-agent").addEventListener("click", async () => {
      const issue = document.getElementById("issue").value;
      const logs = document.getElementById("logs").value;
     
      const res = await fetch("http://localhost:3000/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue, logs })
      });
     
      const data = await res.json();
      document.getElementById("output").textContent = data.solution;
    });