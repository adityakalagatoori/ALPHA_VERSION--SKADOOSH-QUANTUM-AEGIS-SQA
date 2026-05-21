import { useEffect, useState } from "react";
import axios from "axios";

export default function Admin() {

    const [password, setPassword] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);

    const [requests, setRequests] = useState([]);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [customPassword, setCustomPassword] = useState("");

    const API = "https://sqa-backend-hsw2.onrender.com";

    // =========================
    // LOGIN
    // =========================

    const handleLogin = async () => {

        try {

            const res = await axios.post(
                `${API}/admin-login`,
                {
                    password
                }
            );

            localStorage.setItem("adminToken", res.data.token);

            setLoggedIn(true);

            fetchRequests();

        } catch (err) {

            alert("Invalid admin password");

        }
    };

    // =========================
    // FETCH REQUESTS
    // =========================

    const fetchRequests = async () => {

        try {

            const token = localStorage.getItem("adminToken");

            const res = await axios.get(
                `${API}/admin/requests`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRequests(res.data);

        } catch (err) {

            console.log(err);

        }
    };

    // =========================
    // APPROVE USER
    // =========================

    const approveUser = async () => {

        try {

            const token = localStorage.getItem("adminToken");

            await axios.post(
                `${API}/admin/approve`,
                {
                    request_id: selectedRequest.id,
                    custom_password: customPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("User approved");

            setSelectedRequest(null);

            fetchRequests();

        } catch (err) {

            console.log(err);

            alert("Approval failed");

        }
    };

    // =========================
    // AUTO LOGIN CHECK
    // =========================

    useEffect(() => {

        const token = localStorage.getItem("adminToken");

        if (token) {
            setLoggedIn(true);
            fetchRequests();
        }

    }, []);

    // =========================
    // LOGIN PAGE
    // =========================

    if (!loggedIn) {

        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

                <h1 className="text-4xl font-bold mb-6 text-yellow-400">
                    SQA Admin Panel
                </h1>

                <input
                    type="password"
                    placeholder="Admin Password"
                    className="p-3 rounded text-black w-80"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={handleLogin}
                    className="mt-4 bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded font-bold"
                >
                    Login
                </button>

            </div>
        );
    }

    // =========================
    // DASHBOARD
    // =========================

    return (
        <div className="min-h-screen bg-black text-white p-10">

            <h1 className="text-5xl font-bold text-yellow-400 mb-10">
                Pending Access Requests
            </h1>

            <div className="space-y-5">

                {
                    requests.map((req) => (

                        <div
                            key={req.id}
                            className="bg-zinc-900 border border-yellow-500 p-5 rounded-xl"
                        >

                            <h2 className="text-2xl font-bold">
                                {req.name}
                            </h2>

                            <p className="text-zinc-300">
                                {req.email}
                            </p>

                            <p className="mt-3">
                                {req.reason}
                            </p>

                            <button
                                onClick={() => setSelectedRequest(req)}
                                className="mt-4 bg-green-600 hover:bg-green-700 px-5 py-2 rounded"
                            >
                                Approve
                            </button>

                        </div>

                    ))
                }

            </div>

            {
                selectedRequest && (

                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">

                        <div className="bg-zinc-900 p-8 rounded-xl w-96">

                            <h2 className="text-2xl font-bold mb-4">
                                Set User Password
                            </h2>

                            <input
                                type="text"
                                placeholder="Custom Password"
                                className="w-full p-3 rounded text-black"
                                value={customPassword}
                                onChange={(e) => setCustomPassword(e.target.value)}
                            />

                            <button
                                onClick={approveUser}
                                className="mt-5 w-full bg-yellow-500 hover:bg-yellow-600 py-3 rounded font-bold"
                            >
                                Confirm Approval
                            </button>

                        </div>

                    </div>

                )
            }

        </div>
    );
}
