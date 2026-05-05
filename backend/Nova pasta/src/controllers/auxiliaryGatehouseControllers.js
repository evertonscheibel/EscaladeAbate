import Vehicle from '../models/Vehicle.js';
import AccessPerson from '../models/AccessPerson.js';
import Company from '../models/Company.js';
import Gatehouse from '../models/Gatehouse.js';
import AccessType from '../models/AccessType.js';
import AccessReason from '../models/AccessReason.js';

// --- VEHICLES ---
export const getVehicles = async (req, res, next) => {
    try {
        const { search, recorrente } = req.query;
        let query = { ativo: true };
        if (recorrente) query.recorrente = true;
        if (search) query.placa = new RegExp(search, 'i');

        const vehicles = await Vehicle.find(query)
            .populate('empresa_id', 'nome_fantasia')
            .limit(50);
        res.json({ success: true, data: vehicles });
    } catch (error) { next(error); }
};

export const createVehicle = async (req, res, next) => {
    try {
        const vehicle = await Vehicle.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, data: vehicle });
    } catch (error) { next(error); }
};

// --- PEOPLE ---
export const getPeople = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = { ativo: true };
        if (search) query.nome = new RegExp(search, 'i');

        const people = await AccessPerson.find(query)
            .populate('empresa_id', 'nome_fantasia')
            .limit(50);
        res.json({ success: true, data: people });
    } catch (error) { next(error); }
};

export const createPerson = async (req, res, next) => {
    try {
        const person = await AccessPerson.create({ ...req.body, createdBy: req.user._id });
        res.status(201).json({ success: true, data: person });
    } catch (error) { next(error); }
};

// --- COMPANIES ---
export const getCompanies = async (req, res, next) => {
    try {
        const { search } = req.query;
        let query = { ativo: true };
        if (search) query.nome_fantasia = new RegExp(search, 'i');

        const companies = await Company.find(query).limit(50);
        res.json({ success: true, data: companies });
    } catch (error) { next(error); }
};

export const createCompany = async (req, res, next) => {
    try {
        const company = await Company.create(req.body);
        res.status(201).json({ success: true, data: company });
    } catch (error) { next(error); }
};

// --- CONFIGS ---
export const getGatehouses = async (req, res, next) => {
    try {
        const gatehouses = await Gatehouse.find({ ativo: true });
        res.json({ success: true, data: gatehouses });
    } catch (error) { next(error); }
};

export const getAccessTypes = async (req, res, next) => {
    try {
        const types = await AccessType.find({ ativo: true }).sort('ordem');
        res.json({ success: true, data: types });
    } catch (error) { next(error); }
};

export const getAccessReasons = async (req, res, next) => {
    try {
        const { tipo_acesso_id } = req.query;
        let query = { ativo: true };
        if (tipo_acesso_id) query.tipo_acesso_id = tipo_acesso_id;

        const reasons = await AccessReason.find(query).sort('ordem');
        res.json({ success: true, data: reasons });
    } catch (error) { next(error); }
};
