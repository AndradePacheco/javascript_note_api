var express = require('express');
var router = express.Router();
const Note = require('../models/note');
const WithAuth = require('../middlewares/auth');

router.post('/', WithAuth, async (req, res) => {
    const {title, body} = req.body;

    try {
        let note = new Note({title: title, body: body, author: req.user._id});
        await note.save();
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({error: 'Error creating note!'});
    }
})

router.get('/search', WithAuth, async (req, res) => {
    let {q} = req.query;
    try {
        let notes = await Note
            .find({author: req.user._id})
            .find({$text: {$search: q}});
            //.find({"$or":[ 
            //  {title: {$regex: q}},
            //  {body: {$regex: q}},
            //]});
         
        res.json(notes);
    } catch (error) {
        
    }
})

router.get('/:id', WithAuth, async (req, res) => {
    try {
        const {id} = req.params;
        let note = await Note.findById(id);
        if(isOwner(req.user, note))
            res.json(note);
        else
        res.status(403).json({error: 'Error: Permission denied!'});
    } catch (error) {
        res.status(500).json({error: 'Error to get the note!'});
    }
})

router.get('/', WithAuth, async (req, res) => {
    try {
        let notes = await Note.find({author: req.user._id});
        res.json(notes);
    } catch (error) {
        res.status(500).json({error: error});
    }
})

router.put('/:id', WithAuth, async (req, res) => {
    const { title, body} = req.body;
    const { id } = req.params;

    try {
        let note = await Note.findById(id);
        if(isOwner(req.user, note)){
            let note = await Note.findByIdAndUpdate(id, 
                {$set: {title: title, body: body}},
                {$upsert: true, "new": true}
                )
            res.json(note);
        } else res.status(403).json({error: 'Error: Permission denied!'});
    } catch (error) {
        res.status(500).json({error: 'Error to update the note!'});
    }
})

router.delete('/:id', WithAuth, async (req, res) => {
    const {id} = req.params;
    try {
        let note = await Note.findById(id);
        if(isOwner(req.user, note)){
            await note.deleteOne();
            res.json({message: "Success!"});
        } else res.status(403).json({error: 'Error: Permission denied!'});
    } catch (error) {
        res.status(500).json({error: 'Error delete the note!'});
    }
})

const isOwner = (user, note) =>{
    if(JSON.stringify(user._id) === JSON.stringify(note.author._id))
        return true;
    else return false
}

module.exports = router;