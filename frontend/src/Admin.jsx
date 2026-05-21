import { useEffect, useState } from "react";
import axios from "axios";

export default function Admin() {

    const API = "http://127.0.0.1:8000";

    const [password, setPassword] = useState("");

    const [loggedIn, setLoggedIn] = useState(false);

    const [requests, setRequests] = useState([]);

    const [selectedRequest, setSelectedRequest] = useState(null);

    const [customPassword, setCustomPassword] = useState("");

    // =================================================
    // LOGIN
    // =================================================

    const handleLogin = async () => {

        try {

            const response = await axios.post(
                `${API}/admin-login`,
                {
                    password: password
                }
            );

            localStorage.setItem(
                "adminToken",
                response.data.token
            );

            setLoggedIn(true);

            fetchRequests();

        } catch (error) {

            console.log(error);

            alert("Invalid admin password");

        }
    };

    // =================================================
    // FETCH REQUESTS
    // =================================================

    const fetchRequests = async () => {

        try {

            const token = localStorage.getItem("adminToken");

            const response = await axios.get(
                `${API}/admin/requests`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRequests(response.data);

        } catch (error) {

            console.log(error);

            alert("Failed to fetch requests");

        }
    };

    // =================================================
    // APPROVE USER
    // =================================================

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

            alert("User approved successfully");

            setSelectedRequest(null);

            setCustomPassword("");

            fetchRequests();

        } catch (error) {

            console.log(error);

            alert("Approval failed");

        }
    };

    // =================================================
    // AUTO LOGIN
    // =================================================

    useEffect(() => {

        const token = localStorage.getItem("adminToken");

        if (token) {

            setLoggedIn(true);

            fetchRequests();

        }

    }, []);

    // =================================================
    // LOGIN PAGE
    // =================================================

    if (!loggedIn) {

        return (

            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">

                <h1 className="text-5xl font-bold text-yellow-400 mb-10">
                    SQA ADMIN
                </h1>

                <input
                    type="password"
                    placeholder="Enter Admin Password"
                    className="w-96 p-4 rounded-xl text-black"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={handleLogin}
                    className="mt-5 bg-yellow-500 hover:bg-yellow-600 px-8 py-4 rounded-xl font-bold"
                >
                    LOGIN
                </button>

            </div>

        );
    }

    // =================================================
    // DASHBOARD
    // =================================================

    return (

        <div className="min-h-screen bg-black text-white p-10">

            <div className="flex justify-between items-center mb-10">

                <h1 className="text-5xl font-bold text-yellow-400">
                    Pending Access Requests
                </h1>

                <button
                    onClick={() => {

                        localStorage.removeItem("adminToken");

                        window.location.reload();

                    }}
                    className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl"
                >
                    Logout
                </button>

            </div>

            <div className="space-y-5">

                {
                    requests.map((request) => (

                        <div
                            key={request.id}
                            className="bg-zinc-900 border border-yellow-500 p-6 rounded-2xl"
                        >

                            <h2 className="text-3xl font-bold">
                                {request.name}
                            </h2>

                            <p className="text-zinc-300 mt-2">
                                {request.email}
                            </p>

                            <p className="mt-5 text-lg">
                                {request.reason}
                            </p>

                            <button
                                onClick={() => setSelectedRequest(request)}
                                className="mt-6 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl"
                            >
                                Approve User
                            </button>

                        </div>

                    ))
                }

            </div>

            {
                selectedRequest && (

                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center">

                        <div className="bg-zinc-900 border border-yellow-500 p-8 rounded-2xl w-[450px]">

                            <h2 className="text-3xl font-bold mb-5 text-yellow-400">
                                Approve User
                            </h2>

                            <p className="mb-5">
                                Create login password:
                            </p>

                            <input
                                type="text"
                                placeholder="Custom Password"
                                className="w-full p-4 rounded-xl text-black"
                                value={customPassword}
                                onChange={(e) => setCustomPassword(e.target.value)}
                            />

                            <div className="flex gap-4 mt-6">

                                <button
                                    onClick={approveUser}
                                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 py-3 rounded-xl font-bold"
                                >
                                    Confirm
                                </button>

                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl"
                                >
                                    Cancel
                                </button>

                            </div>

                        </div>

                    </div>

                )
            }

        </div>

    );
}